"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Cpu, Zap, Shield, Clock, ArrowRight, CheckCircle2,
    MessageSquare, Brain, Image as ImageIcon, Binary, Sparkles, Terminal, Info,
    Database, Link2, HardDrive, Lock, Fingerprint, Wallet
} from "lucide-react"
import { useWallet } from "@txnlab/use-wallet-react"
import algosdk from "algosdk"

interface GPU {
    id: string
    gpu_model: string
    vram_gb: number
    price_per_minute: number
    status: string
    owner_wallet: string
    architecture?: string
    cuda_cores?: number
    tensor_cores?: number
    pcie_gen?: string
    pcie_lanes?: string
    utilization_gpu?: number
    temperature_gpu?: number
    uptime_score?: number
    is_verified?: boolean
    bench_score?: number
    ping_latency?: number
}

type WorkloadType = 'inference' | 'finetune' | 'rendering' | 'engineering'

interface Workload {
    id: WorkloadType
    name: string
    description: string
    icon: any
    minVram: number
    minCores?: number
    requiresTensor?: boolean
    image: string
    color: string
}

const WORKLOADS: Workload[] = [
    {
        id: 'inference',
        name: "AI Inference",
        description: "Deploy chatbots, translation services, or small scripts. Optimized for low latency.",
        icon: MessageSquare,
        minVram: 4,
        requiresTensor: true,
        image: "vllm/vllm-openai",
        color: "#69E300"
    },
    {
        id: 'finetune',
        name: "AI Fine-Tuning",
        description: "Train SLMs or LLMs like Llama-3-8B. Requires high VRAM and bandwidth.",
        icon: Brain,
        minVram: 12,
        requiresTensor: true,
        image: "unsloth/llama-3-8b-finetune",
        color: "#00E0FF"
    },
    {
        id: 'rendering',
        name: "3D Rendering",
        description: "Blender or video encoding. Maximizes CUDA core utilization.",
        icon: ImageIcon,
        minVram: 4,
        minCores: 2000,
        image: "nytimes/blender",
        color: "#FF00E5"
    },
    {
        id: 'engineering',
        name: "Engineering",
        description: "GATE/CFD Simulations. High-precision (FP32) performance mission.",
        icon: Binary,
        minVram: 16,
        minCores: 5000,
        image: "openfoam/openfoam",
        color: "#FFD600"
    }
]

export default function MarketplacePage() {
    const [step, setStep] = useState<'profiler' | 'dataset' | 'marketplace'>('profiler')
    const [selectedWorkload, setSelectedWorkload] = useState<Workload | null>(null)
    const [dataSourceType, setDataSourceType] = useState<'huggingface' | 'url' | 'ipfs' | 'none'>('huggingface')
    const [dataSourceValue, setDataSourceValue] = useState('')
    const [gpus, setGpus] = useState<GPU[]>([])
    const [loading, setLoading] = useState(true)
    const [rentingId, setRentingId] = useState<string | null>(null)
    const [datasetSizeGb, setDatasetSizeGb] = useState<number>(5)
    const [isSigning, setIsSigning] = useState(false)
    const [signProgress, setSignProgress] = useState(0)
    const [signingModel, setSigningModel] = useState('')

    const { activeAddress, signTransactions } = useWallet()

    const DATA_SOURCE_OPTIONS = [
        { id: 'huggingface' as const, label: 'HuggingFace Dataset', icon: Database, placeholder: 'HuggingFaceH4/ultrachat_200k', hint: 'Auto-downloaded inside the container via datasets library.' },
        { id: 'url' as const, label: 'Public URL / S3', icon: Link2, placeholder: 'https://bucket.s3.amazonaws.com/data.zip', hint: 'Any publicly accessible URL (S3, Google Drive, Dropbox).' },
        { id: 'ipfs' as const, label: 'IPFS CID', icon: HardDrive, placeholder: 'QmXfR4zn…', hint: 'Decentralized, censorship-resistant storage — fits the Web3 thesis.' },
        { id: 'none' as const, label: 'Skip / Use Built-in', icon: ArrowRight, placeholder: '', hint: 'Run with the image\'s bundled demo data. Great for testing.' },
    ]

    const fetchGpus = async () => {
        try {
            const res = await fetch("http://localhost:3001/list")
            const data = await res.json()
            setGpus(data)
        } catch (error) {
            console.error("Failed to fetch GPUs:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchGpus()
        const interval = setInterval(fetchGpus, 10000)
        return () => clearInterval(interval)
    }, [])

    const filteredGpus = useMemo(() => {
        if (!selectedWorkload) return gpus
        return gpus.filter(gpu => {
            const vram = gpu.vram_gb || 4;
            const cores = gpu.cuda_cores || 0;
            const hasTensor = (gpu.tensor_cores || 0) > 0;
            const uptime = gpu.uptime_score || 100;

            const vramOk = vram >= selectedWorkload.minVram;
            const coresOk = !selectedWorkload.minCores || cores >= selectedWorkload.minCores;
            const tensorOk = !selectedWorkload.requiresTensor || hasTensor;
            const uptimeOk = uptime >= 98; // User's constraint for Fine-Tuning/Engineering

            // Also ensure it's not currently 'Detecting Hardware...'
            const hasModel = gpu.gpu_model && gpu.gpu_model !== "Detecting Hardware...";

            return vramOk && coresOk && tensorOk && uptimeOk && hasModel;
        })
    }, [gpus, selectedWorkload])

    const recommendedGpuId = useMemo(() => {
        if (filteredGpus.length === 0) return null
        return [...filteredGpus].sort((a, b) => a.price_per_minute - b.price_per_minute)[0]?.id
    }, [filteredGpus])

    const getRecommendationReason = (gpu: GPU) => {
        if (!selectedWorkload) return ""

        const otherGpus = gpus.filter(g => g.id !== gpu.id && g.gpu_model.includes('4090'))
        if (otherGpus.length > 0) {
            const avg4090Price = otherGpus.reduce((acc, g) => acc + g.price_per_minute, 0) / otherGpus.length
            const savings = Math.round(((avg4090Price - gpu.price_per_minute) / avg4090Price) * 100)
            if (savings > 10) {
                return `The ${gpu.gpu_model} (${gpu.vram_gb}GB) meets your ${selectedWorkload.name} requirements and is ${savings}% cheaper than the 4090s on the grid right now.`
            }
        }

        return `The ${gpu.gpu_model} (${gpu.vram_gb}GB) is the most cost-effective hardware for your ${selectedWorkload.name} mission right now.`
    }

    const buildScript = () => {
        const dsEnv = dataSourceType === 'huggingface' && dataSourceValue
            ? `import os; os.environ['DATASET_SOURCE']='hf://${dataSourceValue}'`
            : dataSourceType === 'url' && dataSourceValue
                ? `import os; os.environ['DATASET_SOURCE']='${dataSourceValue}'`
                : dataSourceType === 'ipfs' && dataSourceValue
                    ? `import os; os.environ['DATASET_SOURCE']='ipfs://${dataSourceValue}'`
                    : ""
        return `import time\n${dsEnv}\nprint('🚀 MISSION START...')\nfor i in range(100):\n    print(f'Progress {i}%...')\n    time.sleep(1)`
    }

    const handleRent = async (gpu: GPU) => {
        setRentingId(gpu.id);
        setIsSigning(true);
        setSigningModel(gpu.gpu_model);
        setSignProgress(0);

        // Calculate Cost Estimations
        const estimated_minutes = datasetSizeGb * 5;
        const estimated_cost = estimated_minutes * gpu.price_per_minute;

        let escrow_tx_hash = "mock_tx_" + Math.random().toString(36).substring(7);

        try {
            if (activeAddress) {
                setSignProgress(25);
                // 1. Setup Algod Client (Testnet)
                console.log("Initializing Algod client...");
                const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
                const params = await algodClient.getTransactionParams().do();
                console.log("Got tx params:", params);

                setSignProgress(50);

                // 2. Construct Escrow Payment Txn
                // Convert ALGO estimate to MicroAlgos
                const amountMicroAlgos = Math.floor(estimated_cost * 1_000_000);
                const escrowAddress = "DKO2GMIFTLXWN4SZYXZ4N7OKBEZU37CIXP3TZG7E3HVWOGP5IXEK4732AQ";

                console.log(`Building Txn: ${amountMicroAlgos} uALGO from ${activeAddress} to ${escrowAddress}`);
                const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                    sender: activeAddress,
                    receiver: escrowAddress,
                    amount: amountMicroAlgos,
                    suggestedParams: params,
                    note: new Uint8Array(Buffer.from(`Escrow for Dataset ${datasetSizeGb}GB Model ${gpu.gpu_model}`))
                });

                const encodedTxn = txn.toByte();

                setSignProgress(75);

                // 3. Prompt user's Lute Wallet to sign
                console.log("Invoking Lute signTransactions...");
                const signedTxns = await signTransactions([encodedTxn]);
                console.log("Lute response:", signedTxns);

                if (!signedTxns || signedTxns.length === 0 || !signedTxns[0]) {
                    throw new Error("Signature failed or rejected by user.");
                }

                // 4. Send Signed Txn to Network
                console.log("Broadcasting to Algorand...");
                const sendResponse = await algodClient.sendRawTransaction(signedTxns[0] as Uint8Array).do();
                escrow_tx_hash = sendResponse.txid;
                console.log("Escrow Secured. TxID:", sendResponse.txid);

                setSignProgress(100);
            } else {
                throw new Error("Please connect your Lute Wallet before deploying a node. We need your wallet to secure the dataset Escrow payout!");
            }

            const res = await fetch("http://localhost:3001/rent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    renter_wallet: activeAddress || "HACKATHON_DEMO_RENTER",
                    gpu_id: gpu.id,
                    minutes: estimated_minutes,
                    dataset_size_gb: datasetSizeGb,
                    estimated_cost: estimated_cost,
                    escrow_tx_hash: escrow_tx_hash,
                    image: selectedWorkload?.image || "pytorch/pytorch:latest",
                    dataset_source: dataSourceType !== 'none' && dataSourceValue ? dataSourceValue : null,
                    script: buildScript()
                })
            });
            const data = await res.json();
            if (data.success) {
                window.location.href = `/jobs/${data.job.id}`;
            }
        } catch (error: any) {
            console.error("Rental failed:", error);
            alert("Payment Signature Failed: " + error.message);
            setIsSigning(false);
        } finally {
            setRentingId(null);
        }
    }

    if (step === 'profiler') {
        return (
            <div className="min-h-screen bg-[#0a0809] text-white">
                <Navigation />
                <main className="pt-40 pb-20 container mx-auto px-6 max-w-[1200px] text-center">
                    <Badge className="bg-[#69E300]/10 text-[#69E300] border-[#69E300]/20 mb-8 px-5 py-2 text-sm font-semibold tracking-wide">
                        Intent-Aware Scheduler
                    </Badge>
                    <h1 className="text-6xl md:text-8xl font-black mb-8 font-display tracking-tight leading-[1.1]">
                        What is your <span className="text-[#69E300]">Mission?</span>
                    </h1>
                    <p className="text-zinc-400 text-2xl mb-20 max-w-3xl mx-auto font-light leading-relaxed">
                        Tell us what you want to achieve, and we'll automatically filter the grid for the most cost-effective hardware.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {WORKLOADS.map((w) => (
                            <button
                                key={w.id}
                                onClick={() => {
                                    setSelectedWorkload(w)
                                    setStep('dataset')   // ← go to dataset step first
                                }}
                                className="group relative bg-zinc-900/30 border border-zinc-800 p-8 rounded-[2rem] text-left hover:border-[#69E300]/40 hover:bg-zinc-900/50 transition-all overflow-hidden"
                            >
                                <div
                                    className="absolute -top-12 -right-12 w-32 h-32 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity rounded-full"
                                    style={{ backgroundColor: w.color }}
                                />
                                <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-6 bg-white/5 border border-white/10">
                                    <w.icon className="text-[#69E300]" size={28} />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">{w.name}</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed mb-6">{w.description}</p>
                                <div className="text-[10px] uppercase font-bold tracking-widest text-[#69E300] flex items-center gap-2">
                                    Min {w.minVram}GB VRAM Required <ArrowRight size={10} />
                                </div>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setStep('marketplace')}
                        className="mt-12 text-zinc-600 hover:text-zinc-400 font-mono text-sm underline underline-offset-4"
                    >
                        Skip to raw list
                    </button>
                </main>
                <Footer />
            </div>
        )
    }

    if (step === 'dataset') {
        const active = DATA_SOURCE_OPTIONS.find(o => o.id === dataSourceType)!
        const dsPrefix = dataSourceType === 'huggingface' ? 'hf://' : dataSourceType === 'ipfs' ? 'ipfs://' : ''
        const envPreview = dataSourceType !== 'none' && dataSourceValue
            ? `DATASET_SOURCE=${dsPrefix}${dataSourceValue}`
            : 'DATASET_SOURCE=(not set — using bundled data)'

        return (
            <div className="min-h-screen bg-[#0a0809] text-white">
                <Navigation />
                <main className="pt-40 pb-20 container mx-auto px-6 max-w-[780px]">
                    <div className="flex items-center gap-3 mb-10 text-sm font-bold">
                        <button onClick={() => setStep('profiler')} className="text-zinc-500 hover:text-[#69E300] transition-colors">MISSION SELECT</button>
                        <span className="text-zinc-700">/</span>
                        <span className="text-[#69E300] uppercase">{selectedWorkload?.name}</span>
                        <span className="text-zinc-700">/</span>
                        <span className="text-zinc-400 uppercase">Configure Data</span>
                    </div>

                    <Badge className="bg-[#69E300]/10 text-[#69E300] border-[#69E300]/20 mb-8 px-5 py-2 text-sm font-semibold tracking-wide">
                        Step 2 of 3 — Data Source
                    </Badge>
                    <h1 className="text-5xl md:text-6xl font-black mb-6 font-display tracking-tight">
                        Where is your <span className="text-[#69E300]">training data?</span>
                    </h1>
                    <p className="text-zinc-400 text-xl mb-16 leading-relaxed">
                        Point gpux to your dataset. It will be injected as <code className="text-zinc-300 font-mono text-base bg-zinc-900 px-3 py-1 rounded-md">DATASET_SOURCE</code> into the container at runtime.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                        {DATA_SOURCE_OPTIONS.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => { setDataSourceType(opt.id); setDataSourceValue('') }}
                                className={`p-4 rounded-2xl border text-left transition-all flex flex-col gap-2 ${dataSourceType === opt.id ? 'border-[#69E300]/60 bg-[#69E300]/5' : 'border-zinc-800 bg-zinc-900/20 hover:border-zinc-700'}`}
                            >
                                <opt.icon size={18} className={dataSourceType === opt.id ? 'text-[#69E300]' : 'text-zinc-500'} />
                                <span className={`text-xs font-black uppercase tracking-tight ${dataSourceType === opt.id ? 'text-[#69E300]' : 'text-zinc-400'}`}>{opt.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8 mb-6 space-y-4">
                        <p className="text-xs text-zinc-500 leading-relaxed">{active.hint}</p>
                        {dataSourceType !== 'none' && (
                            <input
                                type="text"
                                value={dataSourceValue}
                                onChange={e => setDataSourceValue(e.target.value)}
                                placeholder={active.placeholder}
                                className="w-full bg-black/60 border border-zinc-800 rounded-2xl px-5 py-4 font-mono text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#69E300]/50 transition-colors"
                            />
                        )}
                        <div className="bg-black/60 rounded-xl px-4 py-3 border border-zinc-800/50 font-mono text-[11px] flex items-center gap-3">
                            <span className="text-zinc-600 uppercase font-black tracking-widest text-[9px] shrink-0">Injected env:</span>
                            <code className={`truncate ${dataSourceType !== 'none' && dataSourceValue ? 'text-[#69E300]' : 'text-zinc-600'}`}>{envPreview}</code>
                        </div>
                    </div>

                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8 mb-6 mt-4">
                        <label className="text-sm font-bold text-zinc-300 block mb-2 uppercase tracking-wide flex items-center gap-2">
                            <HardDrive size={16} /> Dataset Size Profile (GB)
                        </label>
                        <p className="text-xs text-zinc-500 mb-6">
                            This creates the cryptographic Escrow lock computation parameter. Nodes are compensated based on execution time, dynamically measured against your payload limit. Excess Escrow is refunded instantly.
                        </p>

                        <div className="flex items-center gap-6">
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={datasetSizeGb}
                                onChange={(e) => setDatasetSizeGb(Number(e.target.value))}
                                className="w-full accent-[#69E300] bg-zinc-800 h-2 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="bg-black border border-zinc-700 rounded-lg px-4 py-2 min-w-[100px] text-center">
                                <span className="font-mono text-xl font-bold text-[#69E300]">{datasetSizeGb}</span>
                                <span className="text-xs text-zinc-500 ml-1">GB</span>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-between text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                            <span>1 GB (Micro)</span>
                            <span>{datasetSizeGb * 5} MIN EST.</span>
                            <span>100 GB (Massive)</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            className="flex-1 h-14 rounded-2xl bg-[#69E300] text-black font-black text-lg hover:scale-[1.02] transition-all shadow-[0_10px_30px_rgba(105,227,0,0.2)] flex items-center justify-center gap-2"
                            onClick={() => setStep('marketplace')}
                            disabled={dataSourceType !== 'none' && !dataSourceValue.trim()}
                        >
                            Find Matching Hardware <ArrowRight size={20} />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-14 px-8 rounded-2xl border-zinc-800 text-zinc-500 hover:bg-zinc-800"
                            onClick={() => { setDataSourceType('none'); setDataSourceValue(''); setStep('marketplace'); }}
                        >
                            Skip
                        </Button>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0a0809] text-white">
            <Navigation />

            <main className="pt-32 pb-20 container mx-auto px-6 max-w-[1400px]">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <button
                                onClick={() => setStep('profiler')}
                                className="text-sm font-bold text-zinc-500 hover:text-[#69E300] transition-colors"
                            >
                                MISSION SELECT
                            </button>
                            <span className="text-zinc-800">/</span>
                            <span className="text-[#69E300] text-sm font-bold uppercase">{selectedWorkload?.name || 'CUSTOM VIEW'}</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black font-display tracking-tight mb-6">
                            Hardware <span className="text-[#69E300]">Decision Matrix</span>
                        </h1>
                        <p className="text-zinc-400 max-w-2xl text-xl leading-relaxed font-light">
                            {selectedWorkload
                                ? `Showing GPUs matching the ${selectedWorkload.name} profile (min ${selectedWorkload.minVram}GB VRAM).`
                                : "The peer-to-peer grid, indexed and verified for performance."}
                        </p>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex gap-8 items-center px-8">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[#69E300]">{filteredGpus.length}</div>
                            <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Compatible Nodes</div>
                        </div>
                        <div className="w-px h-8 bg-zinc-800" />
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">
                                {filteredGpus.reduce((acc, g) => acc + (g.vram_gb || 0), 0)}GB
                            </div>
                            <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Available VRAM</div>
                        </div>
                    </div>
                </div>

                {loading && filteredGpus.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-[400px] bg-zinc-900/20 border border-zinc-800/50 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredGpus.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 mb-6">
                            <Cpu className="text-zinc-600" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">No hardware matches this mission</h2>
                        <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                            The grid currently doesn't have nodes with {selectedWorkload?.minVram}GB+ VRAM online.
                            Try another mission or check back later.
                        </p>
                        <Button variant="outline" onClick={() => setStep('profiler')} className="border-zinc-800">
                            Back to Mission Select
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredGpus.map((gpu) => (
                            <GPUCard
                                key={gpu.id}
                                gpu={gpu}
                                datasetSizeGb={datasetSizeGb}
                                onRent={() => handleRent(gpu)}
                                isRenting={rentingId === gpu.id}
                                isRecommended={gpu.id === recommendedGpuId}
                                workload={selectedWorkload}
                                recommendationReason={gpu.id === recommendedGpuId ? getRecommendationReason(gpu) : ""}
                            />
                        ))}
                    </div>
                )}

                {/* Protocol Pitch Section */}
                <div className="mt-32 p-12 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-[3rem]">
                    <div className="max-w-3xl mx-auto text-center">
                        <Badge variant="outline" className="mb-6 border-zinc-800 text-zinc-500 font-mono">Marketplace Protocol v1.0</Badge>
                        <h2 className="text-3xl font-bold mb-6">Smart Matchmaking: The Intent-Aware Scheduler</h2>
                        <p className="text-zinc-500 leading-relaxed text-lg mb-8">
                            "Our marketplace isn't a static list; it's an <b>Intent-Aware Scheduler</b>. Users don't need to be hardware experts.
                            They tell gpux what they want to achieve, and our protocol automatically filters the grid for the most
                            cost-effective hardware that meets their VRAM and compute requirements."
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                            <div className="bg-black/40 p-6 rounded-2xl border border-zinc-800/50">
                                <h4 className="font-bold text-[#69E300] mb-2 uppercase text-xs tracking-widest">Indexing</h4>
                                <p className="text-xs text-zinc-500">Fast queries across the Algorand grid for specific VRAM & Core constraints.</p>
                            </div>
                            <div className="bg-black/40 p-6 rounded-2xl border border-zinc-800/50">
                                <h4 className="font-bold text-[#69E300] mb-2 uppercase text-xs tracking-widest">Transaction</h4>
                                <p className="text-xs text-zinc-500">Atomic transfers lock ALGO in escrow, triggering the Start Job signal instantly.</p>
                            </div>
                            <div className="bg-black/40 p-6 rounded-2xl border border-zinc-800/50">
                                <h4 className="font-bold text-[#69E300] mb-2 uppercase text-xs tracking-widest">Execution</h4>
                                <p className="text-xs text-zinc-500">Provider daemons pull mission-specific images for zero-config deployment.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- ESCROW SIGNATURE MODAL --- */}
                {isSigning && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0809]/80 backdrop-blur-sm">
                        <div className="bg-[#050505] border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            {/* Decorative blur */}
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#69E300]/20 blur-[50px] rounded-full" />

                            <div className="flex flex-col items-center text-center">
                                <div className="h-20 w-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 relative">
                                    {signProgress < 100 ? (
                                        <Fingerprint size={32} className="text-[#69E300] animate-pulse" />
                                    ) : (
                                        <CheckCircle2 size={32} className="text-[#69E300]" />
                                    )}
                                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                                        <circle cx="40" cy="40" r="38" className="stroke-zinc-800" strokeWidth="4" fill="none" />
                                        <circle cx="40" cy="40" r="38" className="stroke-[#69E300] transition-all duration-100 ease-out" strokeWidth="4" fill="none" strokeDasharray="238" strokeDashoffset={238 - (238 * signProgress) / 100} />
                                    </svg>
                                </div>

                                <h3 className="text-2xl font-bold mb-2">
                                    {signProgress < 100 ? "Sign Transaction" : "Deposit Locked!"}
                                </h3>

                                <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                                    {signProgress < 100
                                        ? `Please approve the 5.00 ALGO escrow deposit in your Pera Wallet to start the ${signingModel} job.`
                                        : "Cryptographic escrow verified. Booting remote container..."}
                                </p>

                                <div className="w-full bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800 text-left space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-500 flex items-center gap-2"><Wallet size={14} /> Network</span>
                                        <span className="font-mono text-zinc-300">Algorand Testnet</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-500 flex items-center gap-2"><Lock size={14} /> Smart Escrow Lock</span>
                                        <div className="text-right">
                                            <div className="font-mono text-[#69E300] font-bold">{(datasetSizeGb * 5 * (gpus.find(g => g.id === rentingId)?.price_per_minute || 0)).toFixed(4)} ALGO</div>
                                            <div className="text-[9px] text-zinc-500">{datasetSizeGb * 5} min est. duration</div>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-[10px] text-zinc-500 italic border-t border-zinc-800/50 pt-2 pb-1">
                                        * Unused compute time will be instantly refunded to your wallet when the node completes processing.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    )
}

function GPUCard({ gpu, datasetSizeGb, onRent, isRenting, isRecommended, workload, recommendationReason }: {
    gpu: GPU,
    datasetSizeGb: number,
    onRent: () => void,
    isRenting: boolean,
    isRecommended: boolean,
    workload: Workload | null,
    recommendationReason: string
}) {
    const estimatedMinutes = datasetSizeGb * 5;
    const estimatedCostAlgo = (estimatedMinutes * gpu.price_per_minute).toFixed(4);

    return (
        <div className={`group relative bg-zinc-900/30 border rounded-[2.5rem] p-8 transition-all hover:bg-zinc-900/50 overflow-hidden ${isRecommended ? 'border-[#69E300]/60 ring-1 ring-[#69E300]/20 shadow-[0_0_50px_rgba(105,227,0,0.1)]' : 'border-zinc-800 hover:border-[#69E300]/40'}`}>

            {isRecommended && (
                <div className="absolute top-6 right-6">
                    <Badge className="bg-[#69E300] text-black font-black uppercase text-[10px] tracking-tight px-3 py-1 flex gap-1.5 items-center">
                        <Sparkles size={12} fill="currentColor" /> Best Match
                    </Badge>
                </div>
            )}

            <div className="flex justify-between items-start mb-10">
                <div className="h-14 w-14 rounded-2xl bg-[#69E300]/10 border border-[#69E300]/20 flex items-center justify-center">
                    <Zap className="text-[#69E300]" size={28} />
                </div>
                {!isRecommended && (
                    <Badge variant="outline" className="border-zinc-800 text-zinc-500 capitalize px-3 py-1">
                        {gpu.status}
                    </Badge>
                )}
            </div>

            <div className="flex items-center gap-2 mb-3">
                <h3 className="text-3xl font-black tracking-tight group-hover:text-[#69E300] transition-colors">{gpu.gpu_model}</h3>
            </div>

            <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-mono bg-black/40 px-3 py-1.5 rounded-full border border-zinc-800/50">
                    <Shield size={10} className="text-[#69E300]" /> {gpu.owner_wallet.substring(0, 8)}
                </div>
                {gpu.bench_score && (
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-bold bg-[#69E300]/5 px-3 py-1.5 rounded-full border border-[#69E300]/10">
                        <Zap size={10} className="text-[#69E300]" /> {gpu.bench_score} TFLOPS
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-black/40 rounded-3xl p-5 border border-zinc-800/50">
                    <div className="text-[10px] text-zinc-500 uppercase mb-2 font-black tracking-widest flex items-center gap-1.5">
                        <Cpu size={12} /> RAM
                    </div>
                    <div className="text-2xl font-black">{gpu.vram_gb || 6}<span className="text-sm font-normal text-zinc-500 ml-1">GB</span></div>
                </div>
                <div className="bg-[#69E300]/5 rounded-3xl p-5 border border-[#69E300]/20">
                    <div className="text-[10px] text-[#69E300] uppercase mb-2 font-black tracking-widest flex items-center gap-1.5">
                        <Lock size={12} /> Escrow Estimate
                    </div>
                    <div className="text-2xl font-black text-[#69E300]">{estimatedCostAlgo}<span className="text-[10px] font-normal text-zinc-400 ml-1 block mt-1">{estimatedMinutes}m computation</span></div>
                </div>
            </div>

            {/* Decision Matrix Logic */}
            <div className="bg-zinc-950/50 rounded-3xl p-5 border border-zinc-800/30 mb-8 space-y-4">
                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-tighter">
                    <span className="text-zinc-600">Network Profile</span>
                    <span className="text-[#69E300]">{gpu.ping_latency || 1}ms Latency</span>
                </div>

                {isRecommended && workload && (
                    <div className="p-3 bg-[#69E300]/5 border border-[#69E300]/10 rounded-2xl mb-4">
                        <p className="text-[11px] text-[#69E300] font-bold leading-tight flex gap-2">
                            <Info size={14} className="shrink-0" />
                            {recommendationReason}
                        </p>
                    </div>
                )}

                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#69E300] animate-pulse" />
                        <span className="text-xs font-bold text-zinc-400">99.9% Uptime</span>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-600 uppercase">
                        Architecture: {gpu.architecture || 'Ada'}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <Button
                    className={`w-full font-black h-14 rounded-2xl group/btn transition-all ${gpu.status === 'busy' ? 'bg-zinc-800 text-zinc-400' : 'bg-[#69E300] text-black hover:scale-[1.02] shadow-[0_10px_30px_rgba(105,227,0,0.2)]'}`}
                    disabled={isRenting || gpu.status === 'busy'}
                    onClick={onRent}
                >
                    {isRenting ? "Allocating Hardware..." : gpu.status === 'busy' ? "Currently Occupied" : "Provision Mission Hardware"}
                </Button>

                {workload && !isRenting && gpu.status !== 'busy' && (
                    <div className="bg-black/60 rounded-2xl p-4 border border-zinc-800/50 group/cli">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] text-zinc-600 uppercase font-black tracking-widest flex items-center gap-1">
                                <Terminal size={10} /> Pre-filled Deployment
                            </span>
                            <Badge className="bg-white/5 text-zinc-500 border-none text-[8px] uppercase">Template Active</Badge>
                        </div>
                        <code className="text-[#69E300] font-mono text-[10px] block truncate">
                            gpux run --image {workload.image} --gpu-id {gpu.id.substring(0, 8)}
                        </code>
                    </div>
                )}
            </div>
        </div>
    )
}
