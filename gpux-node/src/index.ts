#!/usr/bin/env node

import { Command } from 'commander';
import Docker from 'dockerode';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';

dotenv.config();

const program = new Command();
const docker = new Docker({ socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });

const COORDINATOR_URL = process.env.COORDINATOR_URL || 'http://localhost:3000';
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
    .action(async (options) => {
        console.log(`Starting gpux-node...`);
        console.log(`Wallet: ${options.wallet}`);

        // 1. Detect GPU constraints
        let gpuModel = "Unknown GPU";
        try {
            const smiOutput = execSync('nvidia-smi --query-gpu=name --format=csv,noheader', { encoding: 'utf8' });
            gpuModel = smiOutput.trim().split('\n')[0];
        } catch (e) {
            console.warn("⚠️  nvidia-smi not found. Proceeding in CPU mock mode.");
        }

        console.log(`Hardware detected: ${gpuModel}`);

        // 2. Connect WebSockets
        const socket: Socket = io(COORDINATOR_URL);

        socket.on('connect', () => {
            console.log(`✅ Connected to Coordinator at ${COORDINATOR_URL}`);

            // Start Heartbeat Loop
            startHeartbeat(options.wallet, gpuModel, parseFloat(options.price));
        });

        socket.on(`start_job_${options.wallet}`, async (payload: { job_id: string, image: string, script: string }) => {
            console.log(`\n🚀 Received Job Request: ${payload.job_id}`);
            await executeWorkload(socket, payload.job_id, payload.image, payload.script);
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

async function startHeartbeat(wallet: string, gpuModel: string, price: number) {
    setInterval(async () => {
        try {
            await axios.post(`${COORDINATOR_URL}/heartbeat`, {
                wallet,
                gpu_model: gpuModel,
                price_per_minute: price,
                status: 'available' // Mock state for hackathon: always available unless actively processing
            });
        } catch (e) {
            console.error("❌ Coordinator offline or unreachable.");
        }
    }, 5000);
}

async function executeWorkload(socket: Socket, jobId: string, image: string, script: string) {
    console.log(`Pulling image ${image}...`);
    // Pull image (skipping progress streams for brevity)
    await new Promise((resolve, reject) => {
        docker.pull(image, (err: any, stream: any) => {
            if (err) return reject(err);
            docker.modem.followProgress(stream, onFinished);
            function onFinished(err: any, output: any) {
                if (err) return reject(err);
                resolve(output);
            }
        });
    });

    console.log(`Running untrusted payload in Sandboxed Container...`);

    try {
        const container = await docker.createContainer({
            Image: image,
            Cmd: ['sh', '-c', `echo "${script}" > payload.py && python3 payload.py`],
            Tty: false,
            // SECURITY MEASURES
            HostConfig: {
                // Strict memory cap
                Memory: 2 * 1024 * 1024 * 1024, // 2GB
                // Network isolation
                NetworkMode: "none",
                // Device binding (if NVIDIA exists)
                // DeviceRequests: [{ Driver: 'nvidia', Count: -1, Capabilities: [['gpu']] }] // uncomment if host actually has nvidia setup
            }
        });

        activeContainers[jobId] = container;
        const stream = await container.attach({ stream: true, stdout: true, stderr: true });

        // Pipe logs to Coordinator via WebSocket
        stream.on('data', (chunk) => {
            const lines = chunk.toString('utf8').split('\n');
            for (let line of lines) {
                if (line.trim().length > 0) {
                    socket.emit('provider_log', { job_id: jobId, log: line });
                    console.log(`[Job ${jobId}] ${line.trim()}`);
                }
            }
        });

        await container.start();

        // Wait for it to finish or timeout
        // Hard Hackathon Timeout: 5 minutes max
        const timeout = setTimeout(async () => {
            console.warn(`Job ${jobId} timed out. Killing container.`);
            await container.kill();
        }, 5 * 60 * 1000);

        await container.wait();
        clearTimeout(timeout);

        console.log(`✅ Job ${jobId} finished executing. Removing container.`);
        await container.remove();
        delete activeContainers[jobId];

        // Signal Coordinator that work is done, allowing Escrow Release
        socket.emit('job_complete', { job_id: jobId });

    } catch (e: any) {
        console.error(`Job Execution Failed:`, e.message);
    }
}

program.parse(process.argv);
