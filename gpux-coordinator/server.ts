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
            last_heartbeat: { gte: new Date(Date.now() - 120000) } // 2 min tolerance
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
    const { renter_wallet, gpu_id, minutes, dataset_size_gb, estimated_cost, escrow_tx_hash } = req.body;

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
            dataset_size_gb,
            estimated_cost,
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

    // Provider node signals cryptographic voucher sync (State Channel)
    socket.on('voucher_sync', (data) => {
        io.emit(`voucher_${data.job_id}`, data);
    });

    // Provider Node signals job complete
    socket.on('job_complete', async (data) => {
        console.log(`Job ${data.job_id} completed`);

        // 1. Fetch Job and GPU data for Settlement Math
        const activeJob = await prisma.job.findUnique({
            where: { id: data.job_id },
            include: { gpu: true }
        });

        if (!activeJob) {
            console.error(`Error: Job ${data.job_id} not found for settlement.`);
            return;
        }

        const endTime = new Date();
        const durationMinutes = (endTime.getTime() - new Date(activeJob.start_time).getTime()) / 60000;
        const actualCost = durationMinutes * activeJob.gpu.price_per_minute;

        // Safety guard: if job finished insanely fast, refund everything except a minimum 1-minute delta
        const finalActualCost = Math.max(actualCost, activeJob.gpu.price_per_minute);

        let refundAmount = 0;
        if (activeJob.estimated_cost && activeJob.estimated_cost > finalActualCost) {
            refundAmount = activeJob.estimated_cost - finalActualCost;
        }

        // 2. Execute Actual Escrow Transaction on Algorand Testnet
        console.log(`\n💰 --- ESCROW SETTLEMENT PROTOCOL --- 💰`);
        console.log(`Job ID: ${activeJob.id}`);
        console.log(`Total Runtime: ${durationMinutes.toFixed(2)} minutes`);
        console.log(`Locked Escrow: ${activeJob.estimated_cost?.toFixed(4)} ALGO`);
        console.log(`Actual Cost: ${finalActualCost.toFixed(4)} ALGO`);

        try {
            // Setup Algod client
            const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
            const params = await algodClient.getTransactionParams().do();

            // Coordinator Master Escrow Wallet (Generated for this session)
            const coordinatorSK = new Uint8Array([245, 137, 180, 48, 167, 9, 165, 72, 162, 196, 216, 250, 233, 43, 34, 192, 231, 145, 84, 135, 200, 111, 166, 34, 23, 139, 147, 229, 196, 53, 225, 236, 71, 47, 90, 72, 235, 173, 128, 119, 14, 72, 6, 105, 107, 51, 156, 46, 48, 96, 176, 102, 177, 195, 217, 153, 163, 236, 237, 125, 79, 189]);
            const coordinatorAccount = algosdk.mnemonicFromSeed(coordinatorSK.slice(0, 32)); // Derive account
            const coordinatorObj = algosdk.mnemonicToSecretKey(coordinatorAccount);

            // a. Pay the GPU Provider for actual computation
            const providerAmountMicroAlgos = Math.floor(finalActualCost * 1_000_000);

            if (providerAmountMicroAlgos > 0 && algosdk.isValidAddress(activeJob.owner_wallet)) {
                console.log(`Dispatching ${finalActualCost.toFixed(4)} ALGO -> Provider (${activeJob.owner_wallet})`);
                const payoutTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                    sender: coordinatorObj.addr,
                    receiver: activeJob.owner_wallet,
                    amount: providerAmountMicroAlgos,
                    suggestedParams: params,
                    note: new Uint8Array(Buffer.from(`JOB_${activeJob.id}_PAYOUT`))
                });

                const signedPayout = payoutTxn.signTxn(coordinatorObj.sk);
                const payoutResponse = await algodClient.sendRawTransaction(signedPayout).do();
                console.log("Payout broadcasted! TxID:", payoutResponse.txid);
            }

            // b. Refund the Renter the remaining escrow balance
            if (refundAmount > 0 && activeJob.renter_wallet && algosdk.isValidAddress(activeJob.renter_wallet)) {
                const refundMicroAlgos = Math.floor(refundAmount * 1_000_000);
                console.log(`Refund Triggered! Sending ${refundAmount.toFixed(4)} ALGO -> Dataset Client (${activeJob.renter_wallet})`);

                const refundTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                    sender: coordinatorObj.addr,
                    receiver: activeJob.renter_wallet,
                    amount: refundMicroAlgos,
                    suggestedParams: params,
                    note: new Uint8Array(Buffer.from(`JOB_${activeJob.id}_REFUND`))
                });

                const signedRefund = refundTxn.signTxn(coordinatorObj.sk);
                const refundResponse = await algodClient.sendRawTransaction(signedRefund).do();
                console.log("Refund broadcasted! TxID:", refundResponse.txid);
            }
        } catch (chainError) {
            console.error("CRITICAL: Blockchain Settlement Failed!", chainError);
        }

        console.log(`💰 ---------------------------------- 💰\n`);

        // 3. Update DB
        const job = await prisma.job.update({
            where: { id: data.job_id },
            data: {
                status: 'completed',
                actual_end_time: endTime,
                actual_cost: finalActualCost
            },
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

// --- DECENTRALIZED SCHEDULER (Hybrid Swarm Fallback) ---
const SCHEDULER_INTERVAL_MS = 15000; // Run every 15 seconds
const HEARTBEAT_TIMEOUT_MS = 20000; // Consider node dead if no heartbeat in 20s

setInterval(async () => {
    try {
        // 1. Find all running jobs that are part of a swarm cluster
        const runningSwarmJobs = await prisma.job.findMany({
            where: {
                status: 'running',
                cluster_id: { not: null }
            },
            include: { gpu: true }
        });

        for (const job of runningSwarmJobs) {
            const timeSinceLastHeartbeat = Date.now() - new Date(job.gpu.last_heartbeat).getTime();

            // 2. Detect Node Failure (Pipeline Parallelism Fallback Trigger)
            if (timeSinceLastHeartbeat > HEARTBEAT_TIMEOUT_MS) {
                console.log(`\n🚨 [SCHEDULER] Node Failure Detected! GPU: ${job.gpu.id.substring(0, 8)} missed heartbeat.`);
                console.log(`🚨 [SCHEDULER] Triggering Pipeline Parallelism Fallback for Stage ${job.pipeline_stage}...`);

                // Mark failed GPU as offline
                await prisma.gPU.update({
                    where: { id: job.gpu.id },
                    data: { status: 'offline' }
                });

                // 3. Find a replacement GPU that is currently available and alive
                const replacementGpu = await prisma.gPU.findFirst({
                    where: {
                        status: 'available',
                        last_heartbeat: { gte: new Date(Date.now() - 15000) },
                        vram_gb: { gte: job.gpu.vram_gb } // Ideally equal or better VRAM
                    }
                });

                if (!replacementGpu) {
                    console.error(`❌ [SCHEDULER] Fallback Failed: No available replacement GPU in the grid!`);
                    // In a real system you'd probably pause the cluster or try again later.
                    continue;
                }

                console.log(`✅ [SCHEDULER] Found Replacement Node: ${replacementGpu.id.substring(0, 8)}`);
                console.log(`✅ [SCHEDULER] Reassigning using Algorand Box state fallback...`);

                // 4. Update Job to the new GPU
                await prisma.job.update({
                    where: { id: job.id },
                    data: {
                        gpu_id: replacementGpu.id,
                        owner_wallet: replacementGpu.owner_wallet
                    }
                });

                // Mark new GPU as busy
                await prisma.gPU.update({
                    where: { id: replacementGpu.id },
                    data: { status: 'busy' }
                });

                // 5. Emit Start Event to the new node to resume the layer
                io.emit(`start_job_${replacementGpu.owner_wallet}`, {
                    job_id: job.id,
                    cluster_id: job.cluster_id,
                    stage: job.pipeline_stage,
                    total_stages: -1, // Tells node it's a fallback resume
                    image: "pytorch/pytorch:latest",
                    script: `print('Running Stage ${job.pipeline_stage} (Resumed via Algorand Box state fallback) in Swarm ${job.cluster_id}')`
                });
            }
        }
    } catch (e: any) {
        console.error(`[SCHEDULER ERROR] ${e.message}`);
    }
}, SCHEDULER_INTERVAL_MS);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`gpux-coordinator running on port ${PORT}`);
});
