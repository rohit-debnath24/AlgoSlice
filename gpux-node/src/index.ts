#!/usr/bin/env node

import { Command } from 'commander';
import Docker from 'dockerode';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const program = new Command();
let docker: any;
try {
    const dockerConfig = process.platform === 'win32' ? { socketPath: '//./pipe/docker_engine' } : { socketPath: '/var/run/docker.sock' };
    docker = new Docker(dockerConfig);
    console.log("🐳 Docker Engine initialized.");
} catch (e) {
    console.warn("⚠️  Could not connect to Docker Engine. Container execution will be disabled.");
}

const COORDINATOR_URL = process.env.COORDINATOR_URL || 'http://localhost:3001';
const activeContainers: Record<string, Docker.Container> = {};

program
    .name('gpux-node')
    .description('Decentralized GPU computing provider daemon')
    .version('1.0.0');

program
    .command('start')
    .description('Start the provider node and connect to the network')
    .requiredOption('-w, --wallet <wallet>', 'Your Algorand Wallet address to receive payments')
    .option('-p, --price <price>', 'Price per minute in USDC/ALGO', '0.01')
    .option('-s, --safety <percent>', 'Resource Limit % (Safety Cushion)', '100')
    .action(async (options: any) => {
        console.log(`Starting gpux-node...`);
        console.log(`Wallet: ${options.wallet}`);

        // 1. Detect GPU constraints & Advanced Telemetry
        let gpuModel = "Unknown GPU";
        let vramGb = 6;
        let architecture = "Unknown";
        let driverVersion = "Unknown";
        let cudaCores = 0; // Requires mapping or complex query, defaulting for demo
        let tensorCores = 0;
        let pcieGen = "N/A";
        let pcieLanes = "N/A";

        try {
            const smi = execSync('nvidia-smi --query-gpu=name,memory.total,driver_version,pcie.link.gen.current,pcie.link.width.current --format=csv,noheader,nounits').toString().split(',');
            if (smi.length >= 5) {
                gpuModel = smi[0].trim();
                vramGb = Math.floor(parseInt(smi[1].trim()) / 1024);
                driverVersion = smi[2].trim();
                pcieGen = smi[3].trim();
                pcieLanes = smi[4].trim();

                // Map features based on model
                if (gpuModel.includes('RTX 40')) {
                    architecture = "Ada Lovelace";
                    cudaCores = 2560; // 4050 Laptop
                    tensorCores = 80;
                } else if (gpuModel.includes('RTX 30')) {
                    architecture = "Ampere";
                }
                console.log(`✅ Real GPU Detected: ${gpuModel}`);
            }
        } catch (e) {
            console.warn(`⚠️ Using CPU Mock mode (nvidia-smi failed or not found)`);
        }

        console.log(`Hardware detected: ${gpuModel} (${vramGb}GB VRAM, ${architecture})`);

        // 2. Connect WebSockets
        const socket: Socket = io(COORDINATOR_URL);

        socket.on('connect', () => {
            console.log(`✅ Connected to Coordinator at ${COORDINATOR_URL}`);

            // Start Heartbeat Loop with full telemetry payload
            startHeartbeat({
                wallet: options.wallet,
                gpuModel,
                vramGb,
                price: parseFloat(options.price),
                safety: parseInt(options.safety),
                architecture,
                driverVersion,
                cudaCores,
                tensorCores,
                pcieGen,
                pcieLanes
            });
        });

        socket.on(`start_job_${options.wallet}`, async (payload: { job_id: string, image: string, script: string, resource_limit_percent: number }) => {
            console.log(`\n🚀 Received Job Request: ${payload.job_id}`);
            await executeWorkload(socket, payload.job_id, payload.image, payload.script, payload.resource_limit_percent);
        });

        // Kill Switch Listener
        socket.on(`stop_job_${options.wallet}`, async (payload: { job_id: string }) => {
            console.log(`\n🛑 Kill Switch Activated for Job: ${payload.job_id}`);
            const container = activeContainers[payload.job_id];
            if (container) {
                try {
                    await container.kill();
                    console.log(`✅ Container forcefully terminated.`);
                } catch (e: any) {
                    console.log(`Container already dead or could not be killed: ${e.message}`);
                }
            }
        });
    });

// --- Core Daemon Logic ---

async function startHeartbeat(data: any) {
    setInterval(async () => {
        let utilization = 0;
        let temperature = 45;
        let diskFree = 50; // Default
        let ping = 25;

        try {
            // 1. GPU Live Status
            const liveStatus = execSync('nvidia-smi --query-gpu=utilization.gpu,temperature.gpu --format=csv,noheader,nounits', { encoding: 'utf8' });
            const [util, temp] = liveStatus.trim().split(',');
            utilization = parseInt(util);
            temperature = parseInt(temp);
        } catch (e: any) { }

        try {
            // 2. Disk Space (GB) - PowerShell for Windows, df for Linux
            if (process.platform === 'win32') {
                const disk = execSync('powershell -command "(Get-WmiObject Win32_LogicalDisk -Filter \\"DeviceID=\'C:\'\\").FreeSpace"').toString().trim();
                diskFree = Math.floor(parseInt(disk) / (1024 * 1024 * 1024));
            } else {
                const disk = execSync('df -BG / --output=avail | tail -n1').toString().trim();
                diskFree = parseInt(disk);
            }
        } catch (e: any) {
            // console.warn("Disk space detection failed, using default.");
        }

        try {
            // 3. Simple Ping Latency - Handle Windows 'time<1ms'
            const host = new URL(COORDINATOR_URL).hostname;
            const pingOut = execSync(process.platform === 'win32' ? `ping -n 1 ${host}` : `ping -c 1 ${host}`).toString();
            const match = pingOut.match(/time[=<](\d+)ms/i) || pingOut.match(/time[=<](\d+\.?\d*) ms/i);
            if (match) {
                ping = parseInt(match[1]) || 1; // Default to 1ms
            } else if (pingOut.includes("<1ms")) {
                ping = 1;
            }
        } catch (e: any) { }

        try {
            await axios.post(`${COORDINATOR_URL}/heartbeat`, {
                wallet: data.wallet,
                gpu_model: data.gpuModel,
                vram_gb: data.vramGb,
                price_per_minute: data.price,
                status: 'available',
                resource_limit_percent: data.safety,
                architecture: data.architecture,
                driver_version: data.driverVersion,
                cuda_cores: data.cudaCores,
                tensor_cores: data.tensorCores,
                pcie_gen: data.pcieGen,
                pcie_lanes: data.pcieLanes,
                utilization_gpu: utilization,
                temperature_gpu: temperature,
                disk_free_gb: diskFree,
                ping_latency: ping,
                bench_score: data.gpuModel.includes('40') ? 85.5 : 42.1, // Mock bench score
                network_speed: 100.0, // Mock for now
                uptime_percent: 99.9,
                reputation_score: 850
            });
            console.log(`📡 Telemetry Sync: ${data.gpuModel.substring(0, 12)} | ${temperature}°C | ${diskFree}GB Free | ${ping}ms Ping`);
        } catch (e: any) {
            console.error(`❌ Coordinator unreachable: ${e.message}`);
        }
    }, 5000);
}

// -------------------------------------------------------------------------------------------------
// DIRECT EXECUTION FALLBACK (No Docker Required)
// -------------------------------------------------------------------------------------------------
async function executeWorkload(socket: Socket, jobId: string, image: string, script: string, limitPercent: number) {
    console.log(`\n[gpux-node] Received Job ${jobId}`);
    console.log(`[gpux-node] Target Image: ${image}`);
    console.log(`[gpux-node] ⚠️ Running in DIRECT EXECUTION mode (Docker bypassed for local demo)`);

    try {
        // 1. Write payload to disk
        const workspaceDir = path.join(process.cwd(), '.gpux_workspace');
        if (!fs.existsSync(workspaceDir)) {
            fs.mkdirSync(workspaceDir);
        }

        const payloadFile = path.join(workspaceDir, `payload_${jobId}.py`);
        fs.writeFileSync(payloadFile, script);
        console.log(`[gpux-node] Saved payload to ${payloadFile}`);

        // 2. Execute via Python directly
        console.log(`[gpux-node] Starting python process...`);
        const pythonProcess = spawn('python', [payloadFile], {
            cwd: workspaceDir,
            env: { ...process.env, PYTHONUNBUFFERED: '1', PYTHONIOENCODING: 'utf-8' } // Force unbuffered & utf8 stdout for real-time logs
        });

        // 3. Stream logs to Coordinator
        pythonProcess.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            for (let line of lines) {
                if (line.trim()) {
                    socket.emit('provider_log', { job_id: jobId, log: line.trim() });
                    console.log(`[Job ${jobId}] ${line.trim()}`);
                }
            }
        });

        pythonProcess.stderr.on('data', (data) => {
            const lines = data.toString().split('\n');
            for (let line of lines) {
                if (line.trim()) {
                    socket.emit('provider_log', { job_id: jobId, log: `[ERR] ${line.trim()}` });
                    console.error(`[Job ${jobId} ERR] ${line.trim()}`);
                }
            }
        });

        // 4. Mock Training Metrics for Dashboard UI
        let epoch = 0;
        const metricInterval = setInterval(() => {
            if (epoch < 50) {
                const loss = Math.max(0.1, 2.5 * Math.exp(-epoch / 10)).toFixed(4);
                const accuracy = Math.min(0.99, 0.4 + (0.6 * (1 - Math.exp(-epoch / 15)))).toFixed(4);

                socket.emit('metric_update', {
                    job_id: jobId,
                    epoch,
                    loss: parseFloat(loss),
                    accuracy: parseFloat(accuracy)
                });
                epoch++;
            }
        }, 3000);

        // 5. Hard Timeout (5 minutes)
        const timeout = setTimeout(() => {
            console.warn(`[gpux-node] Job ${jobId} timed out. Killing process.`);
            pythonProcess.kill();
        }, 5 * 60 * 1000);

        // 6. Handle Completion
        pythonProcess.on('close', (code) => {
            clearTimeout(timeout);
            clearInterval(metricInterval);
            console.log(`[gpux-node] ✅ Job ${jobId} finished with code ${code}`);

            // Cleanup
            try { fs.unlinkSync(payloadFile); } catch (e) { }

            // Signal Completion
            socket.emit('job_complete', { job_id: jobId });
        });

    } catch (e: any) {
        console.error(`[gpux-node] Job Execution Failed:`, e.message);
    }
}


program.parse(process.argv);
