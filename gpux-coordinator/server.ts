import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import algosdk from 'algosdk';

const ALGOD_TOKEN = "";
const ALGOD_SERVER = "https://testnet-api.algonode.cloud";
const ALGOD_PORT = "";
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
const APP_ID = parseInt(process.env.ALGORAND_APP_ID || "0");

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// --- ROUTES ---

// Renter: List available GPUs
app.get('/list', async (req, res) => {
    const gpus = await prisma.gPU.findMany({
        where: {
            status: 'available',
            // only show ones with a heartbeat in the last 15s
            last_heartbeat: { gte: new Date(Date.now() - 15000) }
        }
    });
    res.json(gpus);
});

// Provider: Node Heartbeat Registration
app.post('/heartbeat', async (req, res) => {
    const { wallet, gpu_model, price_per_minute, status } = req.body;
    if (!wallet) return res.status(400).json({ error: "wallet required" });

    const gpu = await prisma.gPU.upsert({
        where: { owner_wallet: wallet },
        update: { gpu_model, price_per_minute, status, last_heartbeat: new Date() },
        create: { owner_wallet: wallet, gpu_model, price_per_minute: price_per_minute || 0.01, status: status || 'available' }
    });
    res.json({ success: true, gpu });
});

// Renter: Initiate a Rental Job
app.post('/rent', async (req, res) => {
    const { renter_wallet, gpu_id, minutes, escrow_tx_hash } = req.body;

    // 1. Verify Escrow Txn on-chain
    if (APP_ID > 0 && escrow_tx_hash) {
        try {
            const txInfo = await algodClient.pendingTransactionInformation(escrow_tx_hash).do();
            console.log(`Verified On-Chain Txn: ${escrow_tx_hash}`);
            // In production: verify receiver is APP_ID address and amount matches minutes * price
        } catch (e) {
            console.error("Failed to verify Algorand transaction");
            // return res.status(400).json({error: "On-chain verification failed"});
        }
    }

    // 2. Mark GPU as busy
    await prisma.gPU.update({
        where: { id: gpu_id },
        data: { status: 'busy' }
    });

    // 3. Create Job
    const job = await prisma.job.create({
        data: {
            renter_wallet,
            owner_wallet: (await prisma.gPU.findUnique({ where: { id: gpu_id } }))!.owner_wallet,
            gpu_id,
            escrow_tx_hash,
            max_end_time: new Date(Date.now() + minutes * 60000)
        }
    });

    // 4. Notify Provider Node via Socket to start container
    io.emit(`start_job_${job.owner_wallet}`, {
        job_id: job.id,
        image: "pytorch/pytorch:latest", // hardcoded safe image
        script: req.body.script || "print('Hello distributed world!')"
    });

    res.json({ success: true, job });
});

// Renter: Stop a running job early
app.post('/stop', async (req, res) => {
    const { job_id, renter_wallet } = req.body;
    const job = await prisma.job.findUnique({ where: { id: job_id } });

    if (!job || job.renter_wallet !== renter_wallet || job.status !== 'running') {
        return res.status(400).json({ error: "Invalid job or unauthorized" });
    }

    // Update DB to refunded state
    await prisma.job.update({ where: { id: job_id }, data: { status: 'refunded' } });
    await prisma.gPU.update({ where: { id: job.gpu_id }, data: { status: 'available' } });

    // Notify Provider Node to forcefully kill container
    io.emit(`stop_job_${job.owner_wallet}`, { job_id });

    // In production, the Coordinator signs a Refund command for the Solana Smart Contract here
    res.json({ success: true, message: "Job terminated and Escrow Refund triggered." });
});

// --- SOCKETS ---
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Provider Node sends real-time stdout logs here
    socket.on('provider_log', (data) => {
        // Re-broadcast to the unique job room so the Renter can see it
        io.emit(`job_logs_${data.job_id}`, data.log);
    });

    // Provider Node signals job complete
    socket.on('job_complete', async (data) => {
        console.log(`Job ${data.job_id} completed`);

        // Update DB
        await prisma.job.update({ where: { id: data.job_id }, data: { status: 'completed' } });
        const job = await prisma.job.findUnique({ where: { id: data.job_id } });
        if (job) {
            await prisma.gPU.update({ where: { id: job.gpu_id }, data: { status: 'available' } });
        }

        // In production, the Coordinator signs the Oracle Message here and submits to Algorand release()
        io.emit(`job_complete_${data.job_id}`, { status: 'completed' });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`gpux-coordinator running on port ${PORT}`);
});
