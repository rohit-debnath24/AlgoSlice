#!/usr/bin/env node

import { Command } from 'commander';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import ora from 'ora';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import algosdk from 'algosdk';
import { exec } from 'child_process';
import path from 'path';

dotenv.config();

const program = new Command();
const COORDINATOR_URL = process.env.COORDINATOR_URL || 'http://localhost:3000';
const ALGOD_TOKEN = "";
const ALGOD_SERVER = "https://testnet-api.algonode.cloud";
const ALGOD_PORT = "";
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
const APP_ID = parseInt(process.env.ALGORAND_APP_ID || "0");
const APP_ADDRESS = algosdk.getApplicationAddress(APP_ID);

program
    .name('gpux')
    .description('Decentralized GPU computing client')
    .version('1.0.0');

// 1. gpux list
program
    .command('list')
    .description('List available GPUs on the network')
    .action(async () => {
        const spinner = ora('Fetching available GPUs...').start();
        try {
            const res = await axios.get(`${COORDINATOR_URL}/list`);
            spinner.stop();
            console.log(chalk.bold.green('\nAvailable GPUs:\n'));
            console.table(res.data.map((gpu: any) => ({
                ID: gpu.id.split('-')[0], // Short ID
                Model: gpu.gpu_model,
                "Price/Min (USDC)": gpu.price_per_minute,
            })));
        } catch (e: any) {
            spinner.fail('Failed to fetch from Coordinator: ' + e.message);
        }
    });

// 2. gpux rent
program
    .command('rent <gpu_id>')
    .description('Deposit escrow and lock a GPU for a specific time')
    .requiredOption('-m, --minutes <minutes>', 'Duration to rent in minutes')
    .requiredOption('-w, --wallet <wallet>', 'Your Algorand Wallet address')
    .action(async (gpu_id, options) => {
        const spinner = ora(`Locking GPU ${gpu_id} for ${options.minutes} minutes...`).start();

        let escrow_tx_hash = "mock_hash";

        if (APP_ID > 0) {
            try {
                // REAL ALGORAND ESCROW DEPOSIT
                const mnemonic = process.env.ALGORAND_MNEMONIC;
                if (!mnemonic) throw new Error("ALGORAND_MNEMONIC not found in .env");

                const account = algosdk.mnemonicToSecretKey(mnemonic);
                const params = await algodClient.getTransactionParams().do();

                // For MVP, we send a direct Payment to the App Address. 
                // In production, we'd use an ABI call to 'deposit' in a Grouped Transaction.
                const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                    sender: account.addr,
                    receiver: APP_ADDRESS,
                    amount: 1000000 * parseFloat(options.minutes) * 0.05, // 0.05 ALGO per min dummy price
                    suggestedParams: params
                });

                const signedTxn = txn.signTxn(account.sk);
                const sendResponse = await algodClient.sendRawTransaction(signedTxn).do();
                const txId = sendResponse.txid;
                escrow_tx_hash = txId;

                spinner.text = `On-Chain Escrow Deposit Sent: ${txId}`;
                await algosdk.waitForConfirmation(algodClient, txId, 4);
            } catch (e: any) {
                spinner.fail(`Algorand Transaction Failed: ${e.message}`);
                return;
            }
        } else {
            // HACKATHON MOCK: Simulate on-chain Escrow Deposit Txn signature
            const mockEscrowHash = `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            spinner.text = `Simulating Algorand Escrow Deposit (Group Txn): ${mockEscrowHash}`;
            await new Promise(r => setTimeout(r, 1500));
            escrow_tx_hash = mockEscrowHash;
        }

        try {
            const res = await axios.post(`${COORDINATOR_URL}/rent`, {
                renter_wallet: options.wallet,
                gpu_id: gpu_id,
                minutes: parseInt(options.minutes),
                escrow_tx_hash: escrow_tx_hash,
                script: `import time\nprint('Training Neural Net on GPU...')\nfor i in range(5):\n    time.sleep(1)\n    print(f'Epoch {i}/5 complete.')`
            });

            if (res.data.success) {
                spinner.succeed(`Successfully rented GPU. Job ID: ${res.data.job.id}`);
                console.log(chalk.cyan(`\nRun \`gpux logs ${res.data.job.id}\` to view execution output.`));
            } else {
                spinner.fail('Failed to rent GPU.');
            }
        } catch (e: any) {
            spinner.fail('Coordinator error: ' + e.message);
        }
    });

// 3. gpux logs
program
    .command('logs <job_id>')
    .description('Stream live execution logs from the provider node')
    .option('-a, --alert', 'Play a voice alert when the job is done (requires ELEVEN_LABS_API_KEY)')
    .action((job_id, options) => {
        console.log(chalk.blue(`Waiting for logs from job ${job_id}...`));

        const socket: Socket = io(COORDINATOR_URL);

        socket.on('connect', () => {
            // Listen to the specific job stream broadcasted by Coordinator
            socket.on(`job_logs_${job_id}`, (logLine: string) => {
                console.log(chalk.gray(`[remote] `) + logLine);
            });

            socket.on(`job_complete_${job_id}`, async () => {
                console.log(chalk.green.bold(`\n✅ Job completed successfully.`));
                console.log(chalk.magenta(`Escrow has been released on-chain by the Coordinator.`));

                if (options.alert) {
                    await playVoiceAlert("Your GPU job is complete. Payout has been released on the Algorand network.");
                }

                process.exit(0);
            });
        });
    });

async function playVoiceAlert(text: string) {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    if (!apiKey) {
        console.log(chalk.yellow("\n⚠️  Eleven Labs API Key not found. Skipping voice alert."));
        return;
    }

    const voiceId = process.env.ELEVEN_LABS_VOICE_ID || 'pNInz6obpg8nEmeWscHe'; // Default "Adam" voice
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    try {
        const response = await axios({
            method: 'post',
            url: url,
            data: {
                text: text,
                model_id: "eleven_monolingual_v1",
                voice_settings: { stability: 0.5, similarity_boost: 0.5 }
            },
            headers: {
                'Accept': 'audio/mpeg',
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            responseType: 'arraybuffer'
        });

        const tempFile = path.join(process.cwd(), 'alert.mp3');
        fs.writeFileSync(tempFile, Buffer.from(response.data));

        // Use PowerShell to play the sound on Windows
        return new Promise((resolve) => {
            const cmd = `powershell.exe -c "(New-Object Media.SoundPlayer '${tempFile}').PlaySync();"`;
            exec(cmd, () => {
                fs.unlinkSync(tempFile);
                resolve(true);
            });
        });
    } catch (e: any) {
        console.error(chalk.red(`\n❌ Voice Alert Failed: ${e.message}`));
    }
}

// 4. gpux stop
program
    .command('stop <job_id>')
    .description('Stop a running job and trigger an Algorand smart contract refund')
    .requiredOption('-w, --wallet <wallet>', 'Your Algorand Wallet address')
    .action(async (job_id, options) => {
        const spinner = ora(`Stopping Job ${job_id} and processing refund...`).start();

        try {
            const res = await axios.post(`${COORDINATOR_URL}/stop`, {
                renter_wallet: options.wallet,
                job_id: job_id
            });

            if (res.data.success) {
                spinner.succeed(chalk.green.bold(res.data.message));
            } else {
                spinner.fail('Failed to stop job.');
            }
        } catch (e: any) {
            spinner.fail(chalk.red('Coordinator error: ' + (e.response?.data?.error || e.message)));
        }
    });

program.parse(process.argv);
