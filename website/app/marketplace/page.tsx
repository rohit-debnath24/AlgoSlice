"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Cpu, Zap, Shield, Clock, ArrowRight, CheckCircle2 } from "lucide-react"

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
}

export default function MarketplacePage() {
    const [gpus, setGpus] = useState<GPU[]>([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState<'individual' | 'swarm'>('individual')
    const [rentingId, setRentingId] = useState<string | null>(null)

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

    const handleRent = async (gpuId: string) => {
        setRentingId(gpuId);
        try {
            const res = await fetch("http://localhost:3001/rent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    renter_wallet: "HACKATHON_DEMO_RENTER",
                    gpu_id: gpuId,
                    minutes: 60,
                    escrow_tx_hash: "mock_tx_" + Math.random().toString(36).substring(7),
                    script: "import time\nprint('🚀 Starting AI Model Training...')\nfor i in range(100):\n    print(f'Epoch {i}: training...')\n    time.sleep(1)"
                })
            });
            const data = await res.json();
            if (data.success) {
                window.location.href = `/jobs/${data.job.id}`;
            }
        } catch (error) {
            console.error("Rental failed:", error);
        } finally {
            setRentingId(null);
        }
    }

    useEffect(() => {
        fetchGpus()
        const interval = setInterval(fetchGpus, 10000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="min-h-screen bg-[#0a0809] text-white">
            <Navigation />

            <main className="pt-32 pb-20 container mx-auto px-6 max-w-[1400px]">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight mb-4">
                            GPU <span className="text-[#69E300]">Marketplace</span>
                        </h1>
                        <p className="text-zinc-400 max-w-xl text-lg">
                            Rent high-performance hardware for AI training, rendering, and complex simulations.
                            Secured by Algorand Escrow.
                        </p>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex gap-8 items-center px-8">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[#69E300]">{gpus.length}</div>
                            <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Nodes Online</div>
                        </div>
                        <div className="w-px h-8 bg-zinc-800" />
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">
                                {gpus.reduce((acc, g) => acc + (g.vram_gb || 0), 0)}GB
                            </div>
                            <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total VRAM</div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mb-8">
                    <Button
                        variant={view === 'individual' ? 'default' : 'outline'}
                        className={view === 'individual' ? "bg-[#69E300] text-black hover:bg-[#5bc200]" : "border-zinc-800 hover:bg-zinc-800"}
                        onClick={() => setView('individual')}
                    >
                        Individual Nodes
                    </Button>
                    <Button
                        variant={view === 'swarm' ? 'default' : 'outline'}
                        className={view === 'swarm' ? "bg-[#69E300] text-black hover:bg-[#5bc200]" : "border-zinc-800 hover:bg-zinc-800"}
                        onClick={() => setView('swarm')}
                    >
                        Virtual Swarm Cluster
                    </Button>
                </div>

                {loading && gpus.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-[400px] bg-zinc-900/20 border border-zinc-800/50 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : gpus.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 mb-6">
                            <Cpu className="text-zinc-600" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">No GPUs available right now</h2>
                        <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                            All nodes are currently busy or offline. Use the CLI to start your own provider node!
                        </p>
                        <code className="bg-black p-4 rounded-xl text-[#69E300] border border-[#69E300]/20">
                            gpux-node start --wallet YOUR_WALLET
                        </code>
                    </div>
                ) : view === 'swarm' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <SwarmCard totalVram={gpus.reduce((acc, g) => acc + (g.vram_gb || 6), 0)} nodeCount={gpus.length} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {gpus.map((gpu) => (
                            <GPUCard
                                key={gpu.id}
                                gpu={gpu}
                                onRent={() => handleRent(gpu.id)}
                                isRenting={rentingId === gpu.id}
                            />
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    )
}

function GPUCard({ gpu, onRent, isRenting }: { gpu: GPU, onRent: () => void, isRenting: boolean }) {
    return (
        <div className="group bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8 hover:border-[#69E300]/40 transition-all hover:bg-zinc-900/50 relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#69E300]/5 blur-[80px] group-hover:bg-[#69E300]/10 transition-all rounded-full" />

            <div className="flex justify-between items-start mb-8">
                <div className="h-14 w-14 rounded-2xl bg-[#69E300]/10 border border-[#69E300]/20 flex items-center justify-center shadow-[0_0_20px_rgba(105,227,0,0.1)]">
                    <Zap className="text-[#69E300]" size={28} />
                </div>
                <Badge variant="outline" className="border-green-500/30 text-green-500 bg-green-500/5 capitalize px-3 py-1">
                    {gpu.status}
                </Badge>
            </div>

            <div className="flex items-center gap-2 mb-2">
                <h3 className="text-2xl font-bold group-hover:text-[#69E300] transition-colors">{gpu.gpu_model}</h3>
                {gpu.is_verified && (
                    <Badge className="bg-[#69E300]/10 text-[#69E300] border-[#69E300]/20 gap-1 px-2">
                        <CheckCircle2 size={12} /> Verified
                    </Badge>
                )}
            </div>
            <p className="text-zinc-500 text-sm font-mono truncate mb-6">{gpu.owner_wallet}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-black/40 rounded-2xl p-4 border border-zinc-800/50">
                    <div className="text-xs text-zinc-500 uppercase mb-1 font-semibold flex items-center gap-1.5">
                        <Clock size={12} /> Rate
                    </div>
                    <div className="text-lg font-bold">{gpu.price_per_minute} <span className="text-sm font-normal text-zinc-500">ALGO</span></div>
                </div>
                <div className="bg-black/40 rounded-2xl p-4 border border-zinc-800/50">
                    <div className="text-xs text-zinc-500 uppercase mb-1 font-semibold flex items-center gap-1.5">
                        <Cpu size={12} /> VRAM
                    </div>
                    <div className="text-lg font-bold">{gpu.vram_gb || 6} <span className="text-sm font-normal text-zinc-500">GB</span></div>
                </div>
            </div>

            {/* Advanced Telemetry Section */}
            <div className="bg-zinc-950/50 rounded-2xl p-4 border border-zinc-800/30 mb-8 space-y-3">
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider">
                    <span className="text-zinc-500">Architecture</span>
                    <span className="text-[#69E300]">{gpu.architecture || 'Unknown'}</span>
                </div>

                <div className="grid grid-cols-2 gap-y-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-600 uppercase font-black tracking-tighter">CUDA Cores</span>
                        <span className="text-sm font-mono">{gpu.cuda_cores || '---'}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-600 uppercase font-black tracking-tighter">Tensor Cores</span>
                        <span className="text-sm font-mono">{gpu.tensor_cores || '---'}</span>
                    </div>
                </div>

                <div className="pt-2 border-t border-zinc-800/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-zinc-600 uppercase">Temp</span>
                            <span className={`text-xs font-mono font-bold ${gpu.temperature_gpu && gpu.temperature_gpu > 75 ? 'text-red-500' : 'text-zinc-300'}`}>
                                {gpu.temperature_gpu || 0}°C
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] text-zinc-600 uppercase">Load</span>
                            <span className="text-xs font-mono font-bold text-zinc-300">
                                {gpu.utilization_gpu || 0}%
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] text-zinc-600 uppercase block">PCIe Health</span>
                        <span className="text-[10px] font-mono text-zinc-400">Gen {gpu.pcie_gen || '?'} x{gpu.pcie_lanes || '?'}</span>
                    </div>
                </div>
            </div>

            <Button
                className={`w-full font-bold h-12 rounded-2xl group/btn ${gpu.status === 'busy' ? 'bg-zinc-800 text-zinc-400' : 'bg-[#69E300] text-black hover:bg-[#5bc200]'}`}
                disabled={isRenting}
                onClick={onRent}
                asChild={gpu.status === 'busy'}
            >
                {gpu.status === 'busy' ? (
                    <Link href={`/jobs/${gpu.id}`} className="flex items-center justify-center gap-2">
                        View Monitoring <ArrowRight size={18} className="translate-x-0 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                ) : (
                    <div className="flex items-center justify-center gap-2 cursor-pointer">
                        {isRenting ? "Deploying Workload..." : "Rent & Start Training"} <ArrowRight size={18} className="translate-x-0 group-hover/btn:translate-x-1 transition-transform" />
                    </div>
                )}
            </Button>

            <div className="flex justify-between items-center mt-4">
                <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-bold">
                    Uptime: {gpu.uptime_score || 99}%
                </p>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-1 w-3 rounded-full ${i <= 4 ? 'bg-[#69E300]/40' : 'bg-zinc-800'}`} />
                    ))}
                </div>
            </div>
        </div>
    )
}

function SwarmCard({ totalVram, nodeCount }: { totalVram: number, nodeCount: number }) {
    return (
        <div className="group bg-[#69E300]/5 border border-[#69E300]/20 rounded-3xl p-8 hover:border-[#69E300]/60 transition-all relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#69E300]/10 blur-[100px] rounded-full" />

            <div className="flex justify-between items-start mb-8">
                <div className="h-14 w-14 rounded-2xl bg-[#69E300] border border-[#69E300]/20 flex items-center justify-center shadow-[0_0_40px_rgba(105,227,0,0.3)]">
                    <Cpu className="text-black" size={28} />
                </div>
                <Badge className="bg-[#69E300] text-black border-none px-3 py-1 font-bold animate-pulse">
                    MULTI-NODE ACTIVE
                </Badge>
            </div>

            <h3 className="text-2xl font-bold mb-2 text-[#69E300]">Virtual GPU Swarm</h3>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                Aggregating all available local nodes into a single Pipeline Parallel cluster.
                Perfect for large models (70B+) that cannot fit on a single laptop GPU.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-black/60 rounded-2xl p-4 border border-[#69E300]/20">
                    <div className="text-xs text-[#69E300]/60 uppercase mb-1 font-bold">Aggregate VRAM</div>
                    <div className="text-2xl font-black text-white">{totalVram}GB</div>
                </div>
                <div className="bg-black/60 rounded-2xl p-4 border border-[#69E300]/20">
                    <div className="text-xs text-[#69E300]/60 uppercase mb-1 font-bold">Active Nodes</div>
                    <div className="text-2xl font-black text-white">{nodeCount}</div>
                </div>
            </div>

            <Button className="w-full bg-white text-black hover:bg-zinc-200 font-bold h-14 rounded-2xl group/btn" asChild>
                <div className="cursor-default flex items-center justify-center gap-2">
                    Deploy Swarm Cluster <ArrowRight size={18} className="translate-x-0 group-hover/btn:translate-x-1 transition-transform" />
                </div>
            </Button>

            <p className="text-xs text-[#69E300] text-center mt-6 font-bold uppercase tracking-widest opacity-60">
                Secured by Pipeline Redundancy
            </p>
        </div>
    )
}
