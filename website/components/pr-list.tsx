"use client"

import { useState, useEffect } from "react"
import { GitPullRequest, Loader2, Play, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface PRListProps {
    owner: string
    repo: string
}

interface PullRequest {
    number: number
    title: string
    user: {
        login: string
    }
    created_at: string
    html_url: string
}

export function PRList({ owner, repo }: PRListProps) {
    const [prs, setPrs] = useState<PullRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [analyzingId, setAnalyzingId] = useState<number | null>(null)
    const router = useRouter()

    useEffect(() => {
        fetchPRs()
    }, [owner, repo])

    const getBackendUrl = () => {
        const url = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        return url.replace(/\/$/, '')
    }

    const fetchPRs = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${getBackendUrl()}/api/github/repos/${owner}/${repo}/pulls`)
            if (!response.ok) {
                throw new Error('Failed to fetch PRs')
            }
            const data = await response.json()
            setPrs(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleAnalyze = async (prNumber: number) => {
        try {
            setAnalyzingId(prNumber)
            const response = await fetch(`${getBackendUrl()}/api/analyze-pr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    owner,
                    repo,
                    pull_number: prNumber
                })
            })

            if (!response.ok) {
                throw new Error('Analysis failed')
            }

            // Refresh the page to show the new audit in the timeline
            router.refresh()

        } catch (err) {
            console.error(err)
            // Optional: Show error toast
        } finally {
            setAnalyzingId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 border border-white/5 rounded-xl bg-[#171717]">
                <Loader2 className="h-6 w-6 animate-spin text-white/40" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4 border border-red-500/20 rounded-xl bg-red-500/5 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Failed to load PRs: {error}
            </div>
        )
    }

    if (prs.length === 0) {
        return (
            <div className="p-8 border border-white/5 rounded-xl bg-[#171717] text-center space-y-2">
                <GitPullRequest className="h-8 w-8 text-white/20 mx-auto" />
                <p className="text-white/40 text-sm">No open pull requests found.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                    <GitPullRequest className="h-5 w-5 text-[#69E300]" />
                    Active Pull Requests
                </h2>
                <span className="text-[11px] font-medium text-white/40 uppercase tracking-widest">
                    {prs.length} Open
                </span>
            </div>

            <div className="grid gap-3">
                {prs.map((pr) => (
                    <div
                        key={pr.number}
                        className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-[#171717] hover:border-white/10 transition-all hover:bg-white/[0.02]"
                    >
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-xs text-[#69E300]">#{pr.number}</span>
                                <h3 className="text-sm font-medium text-white group-hover:text-[#69E300] transition-colors">
                                    {pr.title}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-white/40">
                                <span>by {pr.user.login}</span>
                                <span>•</span>
                                <span>{new Date(pr.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => handleAnalyze(pr.number)}
                            disabled={analyzingId === pr.number}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                                analyzingId === pr.number
                                    ? "bg-white/5 text-white/40 cursor-wait"
                                    : "bg-[#69E300]/10 text-[#69E300] hover:bg-[#69E300]/20"
                            )}
                        >
                            {analyzingId === pr.number ? (
                                <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Play className="h-3 w-3 fill-current" />
                                    Audit
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
