import { Terminal, Shield, FileText, CheckCircle2 } from "lucide-react"
import { useEffect, useState } from "react"

// Initial static data as fallback
const INITIAL_ACTIVITIES = [
  {
    id: "1",
    agent: "SecurityAuditor",
    action: "identified vulnerability in next-auth session handling",
    repo: "ghostwriter-core",
    time: "2m ago",
    icon: Shield,
    type: "critical",
  },
]

export function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>(INITIAL_ACTIVITIES)

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        const res = await fetch('/api/audits')
        if (res.ok) {
          const data = await res.json()
          // Transform backend data to activity format
          const newActivities = data.map((audit: any) => ({
            id: audit.id,
            agent: "Ghostwriter Agent", // or drive from result
            action: `analyzed PR #${audit.pr_id}`,
            repo: audit.repo,
            time: new Date(audit.timestamp).toLocaleTimeString(),
            icon: audit.result?.status === 'success' ? CheckCircle2 : Shield,
            type: audit.result?.status === 'success' ? 'success' : 'critical'
          }))
          if (newActivities.length > 0) {
            setActivities(newActivities)
          }
        }
      } catch (error) {
        console.error("Failed to fetch activities", error)
      }
    }

    // Poll every 5 seconds
    fetchAudits()
    const interval = setInterval(fetchAudits, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-4 rounded-xl border border-white/5 bg-[#171717] p-4 transition-all hover:bg-[#1a1a1a] animate-in fade-in slide-in-from-left-4 duration-500"
        >
          <div
            className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border ${activity.type === "critical"
                ? "bg-red-500/10 border-red-500/20 text-red-500"
                : activity.type === "success"
                  ? "bg-[#69E300]/10 border-[#69E300]/20 text-[#69E300]"
                  : "bg-blue-500/10 border-blue-500/20 text-blue-500"
              }`}
          >
            <activity.icon className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">{activity.agent}</span>
              <span className="text-[10px] font-medium text-white/20 uppercase tracking-widest">{activity.time}</span>
            </div>
            <p className="text-sm text-white/60">
              {activity.action} on <span className="text-white/80 font-medium">{activity.repo}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
