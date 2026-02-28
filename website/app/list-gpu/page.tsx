"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
    ShieldAlert,
    Cpu,
    Zap,
    Monitor,
    CheckCircle2,
    Terminal,
    Info,
    Settings,
    LayoutDashboard
} from "lucide-react"
import { motion } from "framer-motion"

export default function ProviderDashboard() {
    const [safetyPercent, setSafetyPercent] = useState(80)
    const [price, setPrice] = useState(0.01)
    const [isListing, setIsListing] = useState(false)
    const [isListed, setIsListed] = useState(false)
    const [gpuName, setGpuName] = useState("Detecting Hardware...")
    const [gpuData, setGpuData] = useState<any>(null)
    const [lastScan, setLastScan] = useState<Date | null>(null)

    const fetchGpuInfo = async () => {
        try {
            const res = await fetch("http://localhost:3001/list")
            const data = await res.json()
            const myGpu = data.find((g: any) => g.owner_wallet === "HACKATHON_DEMO_WALLET")
            if (myGpu) {
                setGpuData(myGpu)
                setGpuName(myGpu.gpu_model)
                setLastScan(new Date())
            }
        } catch (error) {
            console.error("Failed to fetch GPU info:", error)
        }
    }

    useEffect(() => {
        fetchGpuInfo()
        const interval = setInterval(fetchGpuInfo, 5000)
        return () => clearInterval(interval)
    }, [])

    const handleListGpu = async () => {
        setIsListing(true)
        try {
            const res = await fetch("http://localhost:3001/heartbeat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet: "HACKATHON_DEMO_WALLET",
                    gpu_model: gpuName,
                    vram_gb: gpuData?.vram_gb || 12,
                    price_per_minute: price,
                    status: "available",
                    resource_limit_percent: safetyPercent,
                    // Pass through captured specs
                    architecture: gpuData?.architecture,
                    cuda_cores: gpuData?.cuda_cores,
                    tensor_cores: gpuData?.tensor_cores,
                    driver_version: gpuData?.driver_version,
                    pcie_gen: gpuData?.pcie_gen,
                    pcie_lanes: gpuData?.pcie_lanes
                })
            })
            if (res.ok) {
                setIsListed(true)
            }
        } catch (error) {
            console.error("Listing failed:", error)
        } finally {
            setIsListing(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0809] text-white">
            <Navigation />

            <main className="pt-32 pb-20 container mx-auto px-6 max-w-[1000px]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-5xl font-bold font-display tracking-tight mb-4">
                            Provider <span className="text-[#69E300]">Dashboard</span>
                        </h1>
                        <p className="text-zinc-400 text-lg">Monetize your idle GPU compute with granular safety controls.</p>
                    </div>
                    {isListed && (
                        <Badge className="bg-[#69E300]/10 text-[#69E300] border-[#69E300]/20 px-4 py-2 text-md flex gap-2">
                            <CheckCircle2 size={16} /> Live on Marketplace
                        </Badge>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Safety & Configuration */}
                    <div className="lg:col-span-12 space-y-8">
                        <Card className="bg-zinc-900/40 border-zinc-800 p-8 rounded-[2rem] overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <ShieldAlert size={120} />
                            </div>

                            <div className="flex items-center gap-3 mb-8">
                                <Settings className="text-[#69E300]" />
                                <h2 className="text-2xl font-bold">Hardware Safety Controls</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <h3 className="text-lg font-bold flex items-center gap-2">
                                                    <Cpu size={18} className="text-[#69E300]" /> GPU Resource Limit
                                                </h3>
                                                <p className="text-sm text-zinc-500">Maximum compute power available to renters.</p>
                                            </div>
                                            <span className="text-2xl font-mono text-[#69E300] font-bold">{safetyPercent}%</span>
                                        </div>
                                        <Slider
                                            value={[safetyPercent]}
                                            onValueChange={(val) => setSafetyPercent(val[0])}
                                            max={100}
                                            step={5}
                                            className="py-4"
                                        />
                                        <div className="flex gap-4 text-xs font-mono text-zinc-600">
                                            <span className={safetyPercent <= 50 ? 'text-[#69E300]' : ''}>STABLE</span>
                                            <span className={safetyPercent > 50 && safetyPercent <= 85 ? 'text-yellow-500' : ''}>PERFORMANCE</span>
                                            <span className={safetyPercent > 85 ? 'text-red-500' : ''}>OVERCLOCK</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <h3 className="text-lg font-bold flex items-center gap-2">
                                                    <Zap size={18} className="text-[#69E300]" /> Rental Price
                                                </h3>
                                                <p className="text-sm text-zinc-500">Earnings per minute in ALGO.</p>
                                            </div>
                                            <span className="text-2xl font-mono text-[#69E300] font-bold">{price} ALGO</span>
                                        </div>
                                        <Slider
                                            value={[price]}
                                            onValueChange={(val) => setPrice(val[0])}
                                            max={0.1}
                                            min={0.001}
                                            step={0.001}
                                            className="py-4"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6 bg-black/40 p-8 rounded-3xl border border-zinc-800/50">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                            <Monitor size={14} /> Local GPU Identity
                                        </h3>
                                        {lastScan && (
                                            <span className="text-[10px] text-zinc-600 font-mono">
                                                Last Heartbeat: {lastScan.toLocaleTimeString()}
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/50">
                                            <div className="flex justify-between font-mono text-sm mb-2">
                                                <span className="text-zinc-500">Hardware Model</span>
                                                <span className="text-[#69E300] font-bold">{gpuName}</span>
                                            </div>
                                            <div className="flex justify-between font-mono text-xs">
                                                <span className="text-zinc-600">Architecture</span>
                                                <span className="text-zinc-400">{gpuData?.architecture || "Detecting..."}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/30">
                                                <span className="text-[10px] text-zinc-600 uppercase font-black">CUDA Cores</span>
                                                <div className="text-lg font-mono font-bold text-zinc-300">{gpuData?.cuda_cores || "---"}</div>
                                            </div>
                                            <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/30">
                                                <span className="text-[10px] text-zinc-600 uppercase font-black">Tensor Cores</span>
                                                <div className="text-lg font-mono font-bold text-zinc-300">{gpuData?.tensor_cores || "---"}</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/30">
                                                <span className="text-[10px] text-zinc-600 uppercase font-black">Temp/Health</span>
                                                <div className={`text-lg font-mono font-bold ${gpuData?.temperature_gpu > 75 ? 'text-red-500' : 'text-[#69E300]'}`}>
                                                    {gpuData?.temperature_gpu || 0}°C
                                                </div>
                                            </div>
                                            <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/30">
                                                <span className="text-[10px] text-zinc-600 uppercase font-black">PCIe Bus</span>
                                                <div className="text-lg font-mono font-bold text-zinc-300">
                                                    Gen {gpuData?.pcie_gen || "?"} x{gpuData?.pcie_lanes || "?"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-zinc-800">
                                        <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl flex gap-3">
                                            <Info size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-yellow-500/80 leading-relaxed">
                                                <b>Real-time Sync Active:</b> Your `gpux-node` is streaming telemetry directly to this dashboard. Limits below 80% protect your hardware longevity.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 flex flex-col md:flex-row gap-6">
                                <Button
                                    className={`flex-1 h-14 rounded-2xl text-lg font-bold transition-all ${isListed ? 'bg-zinc-800 text-zinc-500 cursor-default' : 'bg-[#69E300] text-black hover:bg-[#5bc200]'}`}
                                    onClick={handleListGpu}
                                    disabled={isListing || isListed}
                                >
                                    {isListing ? (
                                        <div className="flex items-center gap-2">
                                            <Terminal size={18} className="animate-pulse" /> Registering with Swarm...
                                        </div>
                                    ) : isListed ? (
                                        "GPU Successfully Listed"
                                    ) : (
                                        "Start Sharing GPU"
                                    )}
                                </Button>
                                <Button variant="outline" className="h-14 px-8 rounded-2xl border-zinc-800 text-zinc-400 hover:bg-zinc-800">
                                    <LayoutDashboard size={20} className="mr-2" /> View Earnings
                                </Button>
                            </div>
                        </Card>
                    </div>

                    {/* How to deploy daemon */}
                    <div className="lg:col-span-12">
                        <div className="bg-zinc-900/20 border border-dashed border-zinc-800 p-8 rounded-[2rem]">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <Terminal size={20} className="text-[#69E300]" /> Run the Provider Daemon
                            </h3>
                            <p className="text-zinc-500 text-sm mb-6">To start accepting jobs after listing, keep the `gpux-node` terminal running on your machine.</p>
                            <div className="bg-black p-4 rounded-xl flex items-center justify-between group">
                                <code className="text-[#69E300] font-mono text-sm">npx gpux-node start --wallet HACKATHON_DEMO_WALLET --safety {safetyPercent}</code>
                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => navigator.clipboard.writeText(`npx gpux-node start --wallet HACKATHON_DEMO_WALLET --safety ${safetyPercent}`)}>Copy</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
