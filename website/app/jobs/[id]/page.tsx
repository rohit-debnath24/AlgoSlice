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
import { Terminal, Activity, Zap, Cpu, ShieldCheck, ArrowLeft, Info, Download } from "lucide-react"
import Link from "next/link"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface MetricPoint {
    epoch: number
    loss: number
    accuracy: number
}

interface Voucher {
    minute: number
    amount: number
    signature: string
}

export default function JobDashboard() {
    const params = useParams()
    const id = params?.id as string
    const [logs, setLogs] = useState<string[]>([])
    const [metrics, setMetrics] = useState<MetricPoint[]>([])
    const [vouchers, setVouchers] = useState<Voucher[]>([])
    const [status, setStatus] = useState<string>("Initializing...")
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
    const [trainedDataPdf, setTrainedDataPdf] = useState<string | null>(null)
    const socketRef = useRef<Socket | null>(null)
    const logsContainerRef = useRef<HTMLDivElement>(null)

    const handleDownloadPDF = () => {
        setIsGeneratingPDF(true)
        try {
            const doc = new jsPDF()

            // Header
            doc.setFontSize(22)
            doc.setTextColor(105, 227, 0) // Hex #69E300
            doc.text("GPUX Distributed Training Report", 14, 20)

            doc.setFontSize(11)
            doc.setTextColor(100)
            doc.text(`Job ID: ${id}`, 14, 30)
            doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36)

            // Final Metrics
            doc.setFontSize(14)
            doc.setTextColor(20)
            doc.text("Final Performance Metrics", 14, 50)

            const lastMetric = metrics[metrics.length - 1]
            if (lastMetric) {
                doc.setFontSize(11)
                doc.setTextColor(50)
                doc.text(`Final Epoch: ${lastMetric.epoch}`, 14, 60)
                doc.text(`Final Loss: ${lastMetric.loss.toFixed(4)}`, 14, 66)
                doc.text(`Final Accuracy: ${(lastMetric.accuracy * 100).toFixed(2)}%`, 14, 72)
            } else {
                doc.setFontSize(11)
                doc.text("No metric data collected.", 14, 60)
            }

            // Logs Matrix
            doc.setFontSize(14)
            doc.setTextColor(20)
            doc.text("Execution Log Trace (STDOUT)", 14, 86)

            const tableRows = logs.map((log, index) => [
                (index + 1).toString(),
                new Date().toLocaleTimeString(), // Mock time for simplicity
                log
            ])

            autoTable(doc, {
                startY: 92,
                head: [['#', 'Time', 'Log Output']],
                body: tableRows,
                theme: 'grid',
                headStyles: { fillColor: [105, 227, 0], textColor: [0, 0, 0] },
                styles: { fontSize: 8, font: 'courier' },
                columnStyles: {
                    0: { cellWidth: 15 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 'auto' }
                },
                margin: { top: 92 }
            })

            doc.save(`gpux-training-report-${id}.pdf`)
        } catch (error) {
            console.error("Failed to generate PDF", error)
        } finally {
            setIsGeneratingPDF(false)
        }
    }

    const handleDownloadTrainedData = () => {
        if (!trainedDataPdf) return
        const link = document.createElement("a")
        link.href = `data:application/pdf;base64,${trainedDataPdf}`
        link.download = `trained_data_extract_${id}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    useEffect(() => {
        // Connect to Coordinator
        const socket = io("http://localhost:3001")
        socketRef.current = socket

        socket.on("connect", () => {
            console.log("Connected to dashboard stream")
            setStatus("Connected to Node")
            // Request replay of any logs+metrics already buffered for this job
            socket.emit("subscribe_job", id)
        })

        // Listen for logs
        socket.on(`job_logs_${id}`, (data: any) => {
            const logText = typeof data === 'string' ? data : data.log || JSON.stringify(data);
            setLogs(prev => [...prev.slice(-100), logText])
        })

        // Listen for metrics
        socket.on(`metrics_${id}`, (data: MetricPoint) => {
            setMetrics(prev => [...prev, data])
        })

        // Listen for actual generated trained data files (PDF)
        socket.on(`job_result_file_${id}`, (data: { filename: string, data: string }) => {
            setTrainedDataPdf(data.data)
        })

        // Listen for off-chain vouchers
        socket.on(`voucher_${id}`, (data: Voucher) => {
            setVouchers(prev => [...prev.slice(-4), data]) // Show latest 5
        })

        socket.on(`job_complete_${id}`, () => {
            setStatus("Job Completed")
        })

        return () => {
            socket.disconnect()
        }
    }, [id])

    useEffect(() => {
        if (logsContainerRef.current) {
            logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight
        }
    }, [logs])

    return (
        <div className="min-h-screen bg-[#0a0809] text-white">
            <Navigation />

            <main className="pt-32 pb-20 container mx-auto px-6 max-w-[1400px]">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <Link href="/marketplace" className="text-zinc-500 hover:text-[#69E300] flex items-center gap-2 mb-6 font-semibold transition-colors">
                            <ArrowLeft size={16} /> Back to Marketplace
                        </Link>
                        <h1 className="text-5xl md:text-6xl font-black font-display tracking-tight flex items-center flex-wrap gap-4 leading-none">
                            Job Monitoring
                            <span className="text-[#69E300] bg-[#69E300]/10 border border-[#69E300]/20 px-4 py-1 rounded-full font-mono text-xl md:text-2xl mt-2 md:mt-0">
                                #{id?.toString().slice(0, 8)}
                            </span>
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
                            <div ref={logsContainerRef} className="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-1">
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
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Node Info */}
                    <div className="space-y-8">
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8">
                            <h3 className="font-black mb-8 text-zinc-400 uppercase tracking-widest text-sm">Node Resources</h3>
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

                        {/* State Channel Panel for Vouchers */}
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#69E300]/10 blur-[40px] rounded-full" />
                            <h3 className="font-black mb-6 text-zinc-400 uppercase tracking-widest text-sm flex items-center justify-between">
                                State Channel
                                <Badge className="bg-[#69E300]/10 text-[#69E300] border-[#69E300]/20 text-[10px]">Zero-Fee P2P</Badge>
                            </h3>

                            <div className="space-y-4 font-mono text-sm max-h-[300px] overflow-hidden">
                                <div className="flex justify-between items-center text-zinc-500 pb-2 border-b border-zinc-800/50 text-xs">
                                    <span>[Escrow]</span>
                                    <span>5.00 ALGO Locked</span>
                                </div>

                                {vouchers.map((v, i) => (
                                    <div key={i} className="flex flex-col gap-1 py-1 animate-in slide-in-from-right-2 fade-in duration-300">
                                        <div className="flex justify-between items-center text-[#69E300]">
                                            <span className="text-xs">Minute {v.minute} Tab</span>
                                            <span>{v.amount.toFixed(2)} ALGO</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck size={12} className="text-zinc-500" />
                                            <span className="text-[10px] text-zinc-500 truncate" title={v.signature}>
                                                Sig: {v.signature.substring(0, 32)}...
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {vouchers.length === 0 && (
                                    <div className="py-6 text-zinc-600 text-center text-xs flex flex-col items-center gap-2">
                                        <Activity size={16} className="animate-pulse" />
                                        <span>Awaiting cryptographic signatures...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-[#69E300]/5 border border-[#69E300]/20 rounded-3xl p-8">
                            <div className="flex items-center gap-3 mb-4 text-[#69E300]">
                                <Info size={20} />
                                <h3 className="font-bold">Protocol Pitch</h3>
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                                <strong>Why this matters:</strong> By using Off-Chain Signed Vouchers, the blockchain acts only as a "Judge" (settlement), not a "Waiter" (payment processor). This eliminates per-minute transaction fees while maintaining 100% cryptographic trust between Renter and Provider.
                            </p>

                            <div className="flex flex-col gap-3">
                                <Button className="w-full bg-[#69E300] text-black hover:bg-[#5bc200] font-bold" onClick={() => alert("Alert registered! You'll receive a voice notification when training hits 95% accuracy.")}>
                                    Alert Me on Completion
                                </Button>

                                <Button
                                    className="w-full bg-zinc-800 text-white hover:bg-zinc-700 font-bold border border-zinc-700 flex items-center gap-2 disabled:opacity-50"
                                    onClick={handleDownloadPDF}
                                    disabled={status !== "Job Completed" && logs.length === 0 || isGeneratingPDF}
                                >
                                    {isGeneratingPDF ? (
                                        <Activity className="animate-pulse w-4 h-4" />
                                    ) : (
                                        <Download className="w-4 h-4" />
                                    )}
                                    {status !== "Job Completed" ? "Download Interstitial Report" : "Download Final Logs"}
                                </Button>

                                <Button
                                    className="w-full mt-2 bg-[#69E300]/20 text-[#69E300] hover:bg-[#69E300]/30 font-bold border border-[#69E300]/50 flex items-center gap-2 transition-all"
                                    onClick={handleDownloadTrainedData}
                                    disabled={!trainedDataPdf}
                                >
                                    <Download className="w-4 h-4" />
                                    {trainedDataPdf ? "Download Trained Data (PDF)" : "AWAITING DATA EXTRACT..."}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
