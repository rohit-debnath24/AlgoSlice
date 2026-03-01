"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, GitPullRequest, CheckCircle, AlertTriangle, Clock } from "lucide-react"

interface Audit {
    id: string
    repo: string
    pr_id: number
    timestamp: string
    result: {
        status: string
        comment: string
    }
    diff?: string
}

export default function DashboardPage() {
    const [audits, setAudits] = useState<Audit[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAudits = async () => {
            try {
                const res = await fetch("http://localhost:3001/api/audits")
                const data = await res.json()
                console.log("Fetched Audits:", data) // Added Log
                setAudits(data)
            } catch (error) {
                console.error("Failed to fetch audits:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchAudits()
        // Poll every 5 seconds
        const interval = setInterval(fetchAudits, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="min-h-screen bg-[#0a0809] text-white p-8">
            <header className="mb-12 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-[#69E300] to-[#E30069] bg-clip-text text-transparent">
                        Ghostwriter Dashboard
                    </h1>
                    <p className="text-zinc-400 mt-2">Real-time PR Analysis Monitor</p>
                </div>
                <div className="flex gap-4">
                    <Link href="/" className="px-4 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-900 transition text-sm">
                        Back to Home
                    </Link>
                </div>
            </header>

            {loading && audits.length === 0 ? (
                <div className="text-center py-20 text-zinc-500">
                    Loading agents...
                </div>
            ) : audits.length === 0 ? (
                <div className="text-center py-20 border border-zinc-800 rounded-xl bg-zinc-900/50">
                    <GitPullRequest className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Audits Yet</h3>
                    <p className="text-zinc-400">Waiting for webhooks...</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {audits.map((audit) => (
                        <div
                            key={audit.id}
                            className="group border border-zinc-800 bg-zinc-900/30 rounded-xl p-6 hover:border-[#69E300]/50 transition-all cursor-default"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                        <GitPullRequest size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-lg">{audit.repo}</h3>
                                        <p className="text-zinc-400 text-sm">PR #{audit.pr_id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                                    <Clock size={12} />
                                    {new Date(audit.timestamp).toLocaleTimeString()}
                                </div>
                            </div>



                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {audit.result.status === 'success' ? (
                                        <span className="flex items-center gap-1.5 text-xs text-[#69E300] bg-[#69E300]/10 px-2 py-1 rounded">
                                            <CheckCircle size={12} /> Success
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-xs text-red-500 bg-red-500/10 px-2 py-1 rounded">
                                            <AlertTriangle size={12} /> Failed
                                        </span>
                                    )}
                                </div>
                                {/* Link to full details if we had that page */}
                                {/* <Link href={`/audit/${audit.repo}/${audit.pr_id}`} className="text-xs text-[#69E300] hover:underline flex items-center gap-1">
                    View Full Report <ArrowRight size={12} />
                 </Link> */}
                            </div>



                        </div>
                    ))}
                </div>
            )
            }
        </div>
    )
}

