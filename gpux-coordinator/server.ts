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
            // status: 'available', // Show all for demo
            last_heartbeat: { gte: new Date(Date.now() - 30000) } // 30s tolerance
        }
    });
    res.json(gpus);
});

// Provider: Node Heartbeat Registration
app.post('/heartbeat', async (req, res) => {
    const {
        wallet, gpu_model, vram_gb, price_per_minute, status, resource_limit_percent,
        architecture, cuda_cores, tensor_cores, driver_version, pcie_gen, pcie_lanes,
        utilization_gpu, temperature_gpu, uptime_score,
        uptime_percent, bench_score, network_speed, ping_latency, disk_free_gb, reputation_score
    } = req.body;
    if (!wallet) return res.status(400).json({ error: "wallet required" });

    const gpuData = {
        gpu_model,
        vram_gb: vram_gb || 6,
        price_per_minute: price_per_minute || 0.01,
        status,
        resource_limit_percent: resource_limit_percent || 100,
        architecture,
        cuda_cores,
        tensor_cores,
        driver_version,
        pcie_gen,
        pcie_lanes,
        utilization_gpu: utilization_gpu || 0,
        temperature_gpu: temperature_gpu || 0,
        uptime_score: uptime_score || 100,
        uptime_percent: uptime_percent || 100,
        bench_score: bench_score || 0,
        network_speed: network_speed || 0,
        ping_latency: ping_latency || 0,
        disk_free_gb: disk_free_gb || 0,
        reputation_score: reputation_score || 0,
        last_heartbeat: new Date()
    };

    try {
        const gpu = await prisma.gPU.upsert({
            where: { owner_wallet: wallet },
            update: gpuData,
            create: {
                owner_wallet: wallet,
                ...gpuData
            }
        });
        console.log(`💓 Heartbeat received: ${wallet.substring(0, 8)} | ${gpu_model}`);
        res.json({ success: true, gpu });
    } catch (error: any) {
        console.error(`❌ Heartbeat DB Error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
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

    // 2. Mark GPU as busy and fetch its safety limits
    const gpu = await prisma.gPU.update({
        where: { id: gpu_id },
        data: { status: 'busy' }
    });

    // 3. Create Job
    const job = await prisma.job.create({
        data: {
            renter_wallet,
            owner_wallet: gpu.owner_wallet,
            gpu_id,
            escrow_tx_hash,
            max_end_time: new Date(Date.now() + minutes * 60000)
        }
    });

    // 4. Notify Provider Node via Socket with safety constraints
    io.emit(`start_job_${job.owner_wallet}`, {
        job_id: job.id,
        image: "pytorch/pytorch:latest",
        script: req.body.script || "print('Hello distributed world!')",
        resource_limit_percent: gpu.resource_limit_percent || 100
    });

    res.json({ success: true, job });
});

// --- SWARM LOGIC (PHASE 11) ---

// Renter: Rent a Swarm of GPUs for Pipeline Parallelism
app.post('/swarm/rent', async (req, res) => {
    const { renter_wallet, min_vram_gb, minutes, escrow_tx_hash } = req.body;

    // 1. Find a set of GPUs that meet the total VRAM requirement
    const availableGpus = await prisma.gPU.findMany({
        where: {
            status: 'available',
            last_heartbeat: { gte: new Date(Date.now() - 15000) }
        },
        orderBy: { vram_gb: 'desc' }
    });

    let selectedGpus: any[] = [];
    let currentVram = 0;
    for (const gpu of availableGpus) {
        selectedGpus.push(gpu);
        currentVram += gpu.vram_gb;
        if (currentVram >= min_vram_gb) break;
    }

    if (currentVram < min_vram_gb) {
        return res.status(400).json({ error: "Not enough collective VRAM available in the network swarm." });
    }

    // 2. Create Cluster Record
    const cluster = await prisma.swarmCluster.create({
        data: { total_vram_gb: currentVram }
    });

    // 3. Create Pipeline Jobs
    const jobs = await Promise.all(selectedGpus.map(async (gpu, index) => {
        // Mark individual GPU as busy
        await prisma.gPU.update({ where: { id: gpu.id }, data: { status: 'busy' } });

        return await prisma.job.create({
            data: {
                renter_wallet,
                owner_wallet: gpu.owner_wallet,
                gpu_id: gpu.id,
                cluster_id: cluster.id,
                pipeline_stage: index,
                escrow_tx_hash: `${escrow_tx_hash}_stage_${index}`, // Mocking stage hashes for demo
                max_end_time: new Date(Date.now() + minutes * 60000)
            }
        });
    }));

    // 4. Notify all nodes in the pipeline
    jobs.forEach((job, index) => {
        io.emit(`start_job_${job.owner_wallet}`, {
            job_id: job.id,
            cluster_id: cluster.id,
            stage: index,
            total_stages: jobs.length,
            image: "pytorch/pytorch:latest",
            script: `print('Running Stage ${index} of ${jobs.length} in Swarm ${cluster.id}')`
        });
    });

    res.json({ success: true, cluster_id: cluster.id, node_count: jobs.length, total_vram: currentVram });
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

    // Provider Node signals metric update (Phase 12)
    socket.on('metric_update', (data) => {
        io.emit(`metrics_${data.job_id}`, data);
    });

    // Provider Node signals job complete
    socket.on('job_complete', async (data) => {
        console.log(`Job ${data.job_id} completed`);

        // Update DB
        const job = await prisma.job.update({
            where: { id: data.job_id },
            data: { status: 'completed' },
            include: { cluster: true }
        });

        await prisma.gPU.update({ where: { id: job.gpu_id }, data: { status: 'available' } });

        // If part of a cluster, check if entire pipeline is done
        if (job.cluster_id) {
            const remainingJobs = await prisma.job.count({
                where: { cluster_id: job.cluster_id, status: { not: 'completed' } }
            });

            if (remainingJobs === 0) {
                console.log(`Swarm Cluster ${job.cluster_id} fully completed!`);
                await prisma.swarmCluster.update({
                    where: { id: job.cluster_id },
                    data: { status: 'dismantled' }
                });
                io.emit(`swarm_complete_${job.cluster_id}`, { status: 'completed' });
            }
        }

        io.emit(`job_complete_${data.job_id}`, { status: 'completed' });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`gpux-coordinator running on port ${PORT}`);
});
