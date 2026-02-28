"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts'
import { io, Socket } from "socket.io-client"
import { Terminal, Activity, Zap, Cpu, ShieldCheck, ArrowLeft, Info } from "lucide-react"
import Link from "next/link"

interface MetricPoint {
    epoch: number
    loss: number
    accuracy: number
}

export default function JobDashboard() {
    const { id } = useParams()
    const [logs, setLogs] = useState<string[]>([])
    const [metrics, setMetrics] = useState<MetricPoint[]>([])
    const [status, setStatus] = useState<string>("Initializing...")
    const socketRef = useRef<Socket | null>(null)
    const logEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Connect to Coordinator
        const socket = io("http://localhost:3001")
        socketRef.current = socket

        socket.on("connect", () => {
            console.log("Connected to dashboard stream")
            setStatus("Connected to Node")
        })

        // Listen for logs
        socket.on(`job_logs_${id}`, (log: string) => {
            setLogs(prev => [...prev.slice(-100), log])
        })

        // Listen for metrics
        socket.on(`metrics_${id}`, (data: MetricPoint) => {
            setMetrics(prev => [...prev, data])
        })

        socket.on(`job_complete_${id}`, () => {
            setStatus("Job Completed")
        })

        return () => {
            socket.disconnect()
        }
    }, [id])

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [logs])

    return (
        <div className="min-h-screen bg-[#0a0809] text-white">
            <Navigation />

            <main className="pt-32 pb-20 container mx-auto px-6 max-w-[1400px]">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <Link href="/marketplace" className="text-zinc-500 hover:text-[#69E300] flex items-center gap-2 mb-4 transition-colors">
                            <ArrowLeft size={16} /> Back to Marketplace
                        </Link>
                        <h1 className="text-4xl font-bold font-display tracking-tight flex items-center gap-4">
                            Job Monitoring <span className="text-[#69E300] font-mono text-2xl opacity-50">#{id?.toString().slice(0, 8)}</span>
                        </h1>
                    </div>
                    <div className="flex gap-4">
                        <Badge variant="outline" className="border-[#69E300]/30 text-[#69E300] bg-[#69E300]/5 px-4 py-2 text-md">
                            ● {status}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Visualizations */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Metrics Chart */}
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Activity size={120} />
                            </div>
                            <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                                <Activity className="text-[#69E300]" size={20} /> Training Metrics
                            </h2>

                            <div className="h-[400px] w-full mt-4">
                                {metrics.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={metrics}>
                                            <defs>
                                                <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#69E300" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#69E300" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                            <XAxis dataKey="epoch" stroke="#52525b" />
                                            <YAxis stroke="#52525b" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Area type="monotone" dataKey="loss" stroke="#ef4444" fillOpacity={1} fill="url(#colorLoss)" strokeWidth={3} name="Loss" />
                                            <Area type="monotone" dataKey="accuracy" stroke="#69E300" fillOpacity={1} fill="url(#colorAcc)" strokeWidth={3} name="Accuracy" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full w-full flex flex-col items-center justify-center text-zinc-600 border border-dashed border-zinc-800 rounded-2xl">
                                        <Activity size={48} className="mb-4 opacity-20" />
                                        <p>Waiting for training telemetry...</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Live Terminal */}
                        <div className="bg-[#050505] border border-zinc-800 rounded-3xl overflow-hidden flex flex-col h-[500px]">
                            <div className="bg-zinc-900 flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <Terminal size={18} className="text-zinc-500" />
                                    <span className="text-sm font-mono font-bold text-zinc-400">REMOTE STDOUT</span>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-zinc-800" />
                                    <div className="w-3 h-3 rounded-full bg-zinc-800" />
                                    <div className="w-3 h-3 rounded-full bg-zinc-800" />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-1">
                                {logs.length === 0 ? (
                                    <p className="text-zinc-700 italic">Initializing secure stream connection...</p>
                                ) : (
                                    logs.map((log, i) => (
                                        <div key={i} className="flex gap-4">
                                            <span className="text-zinc-700 min-w-[30px]">{i + 1}</span>
                                            <span className={log.includes('[TRN]') ? 'text-[#69E300]' : 'text-zinc-300'}>
                                                {log}
                                            </span>
                                        </div>
                                    ))
                                )}
                                <div ref={logEndRef} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Node Info */}
                    <div className="space-y-8">
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8">
                            <h3 className="font-bold mb-6 text-zinc-400 uppercase tracking-widest text-xs">Node Resources</h3>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3 text-zinc-300">
                                        <Cpu size={20} className="text-[#69E300]" /> Compute Usage
                                    </div>
                                    <span className="font-mono text-[#69E300]">88%</span>
                                </div>
                                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-[#69E300] h-full" style={{ width: '88%' }} />
                                </div>

                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3 text-zinc-300">
                                        <Zap size={20} className="text-[#69E300]" /> VRAM Allocated
                                    </div>
                                    <span className="font-mono text-[#69E300]">5.4 / 6.0 GB</span>
                                </div>
                                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-[#69E300] h-full" style={{ width: '90%' }} />
                                </div>

                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3 text-zinc-300">
                                        <ShieldCheck size={20} className="text-[#69E300]" /> Docker Integrity
                                    </div>
                                    <span className="font-mono text-[#69E300]">Verified</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#69E300]/5 border border-[#69E300]/20 rounded-3xl p-8">
                            <div className="flex items-center gap-3 mb-4 text-[#69E300]">
                                <Info size={20} />
                                <h3 className="font-bold">About pipeline stages</h3>
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                                This job is currently running on Stage 0 of the pipeline. High-speed activations are being streamed between dorm nodes using standard HTTPS/WSS protocols.
                            </p>
                            <Button className="w-full bg-[#69E300] text-black hover:bg-[#5bc200] font-bold" onClick={() => alert("Alert registered! You'll receive a voice notification when training hits 95% accuracy.")}>
                                Alert Me on Completion
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
