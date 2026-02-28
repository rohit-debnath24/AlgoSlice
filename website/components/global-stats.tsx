import { Clock, ShieldCheck, Zap, GitBranch } from "lucide-react"
import { useEffect, useState } from "react"

const INITIAL_STATS = [
  { id: "pr", label: "Pull Requests Reviewed", value: "0", icon: GitBranch, sub: "waiting for data..." },
  { id: "vuln", label: "Security Vulnerabilities Patched", value: "0", icon: ShieldCheck, sub: "0 critical pending" },
  { id: "time", label: "Avg. Review Time", value: "--", icon: Clock, sub: "vs 4.2h human" },
  { id: "rate", label: "Agent Success Rate", value: "100%", icon: Zap, sub: "Verified by Weave" },
]

export function GlobalStats() {
  const [stats, setStats] = useState(INITIAL_STATS)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats')
        if (res.ok) {
          const data = await res.json()
          setStats([
            { id: "pr", label: "Pull Requests Reviewed", value: data.audits_reviewed.toString(), icon: GitBranch, sub: "+12% this week" },
            { id: "vuln", label: "Security Vulnerabilities Patched", value: data.vulnerabilities_patched.toString(), icon: ShieldCheck, sub: "0 critical pending" },
            { id: "time", label: "Avg. Review Time", value: data.avg_review_time, icon: Clock, sub: "vs 4.2h human" },
            { id: "rate", label: "Agent Success Rate", value: `${data.agent_success_rate}%`, icon: Zap, sub: "Verified by Weave" },
          ])
        }
      } catch (error) {
        console.error("Failed to fetch global stats", error)
      }
    }

    // Poll every 5 seconds
    fetchStats()
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#171717] p-6 transition-all hover:bg-[#1a1a1a]"
        >
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#69E300]/10 border border-[#69E300]/20 text-[#69E300]">
            <stat.icon className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/30">{stat.label}</h4>
            <div className="text-3xl font-black text-white group-hover:text-[#69E300] transition-colors animate-in fade-in zoom-in duration-300">
              {stat.value}
            </div>
            <p className="text-[11px] font-medium text-[#69E300]/60">{stat.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
