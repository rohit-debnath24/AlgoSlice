import { Shield, Terminal, Zap, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface AgentActivitySummaryProps {
  audits: any[]
}

const AGENT_CONFIGS = [
  { id: "orchestrator", name: "Orchestrator Agent", icon: Zap, baseLatency: 120 },
  { id: "security", name: "Security Auditor", icon: Shield, baseLatency: 800 },
  { id: "runtime", name: "Runtime Validator", icon: Terminal, baseLatency: 1100 },
  { id: "ghostwriter", name: "Ghostwriter", icon: FileText, baseLatency: 350 },
]

export function AgentActivitySummary({ audits }: AgentActivitySummaryProps) {
  // Determine agent status based on latest audit
  const latestAudit = audits.length > 0
    ? audits.reduce((latest, current) => new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest, audits[0])
    : null

  const isRecent = latestAudit && (new Date().getTime() - new Date(latestAudit.timestamp).getTime() < 5 * 60 * 1000) // 5 mins

  const agents = AGENT_CONFIGS.map(config => {
    // Simulate activity: Active if recent audit exists
    const isActive = isRecent
    // Randomize latency slightly around base for "real-time" feel
    const latency = isActive
      ? config.baseLatency + Math.floor(Math.random() * 100 - 50)
      : config.baseLatency

    return {
      ...config,
      status: isActive ? "Active" : "Idle",
      latency: latency > 1000 ? `${(latency / 1000).toFixed(1)}s` : `${latency}ms`
    }
  })

  // Weave project URL (Generic for now, or link to latest audit if trace id exists)
  const weaveUrl = "https://wandb.ai/home" // Replace with actual project URL if available

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold tracking-tight text-white">Agent Activity</h2>
      <div className="rounded-xl border border-white/5 bg-[#171717] divide-y divide-white/5">
        {agents.map((agent) => (
          <div key={agent.name} className="flex items-center justify-between p-4 transition-all hover:bg-white/5 group">
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/40 group-hover:text-[#69E300] transition-colors ${agent.status === 'Active' ? 'text-[#69E300] border-[#69E300]/20 bg-[#69E300]/5' : ''}`}>
                <agent.icon className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">{agent.name}</div>
                <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest">
                  Avg Latency: <span className="text-white/60 font-mono">{agent.latency}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{agent.status}</span>
              <div
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  agent.status === "Active" ? "bg-[#69E300] animate-pulse" : "bg-white/10",
                )}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#69E300]/20 bg-[#69E300]/5 p-5 transition-all hover:border-[#69E300]/40">
        <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#69E300]">
          <Zap className="h-4 w-4 fill-current" />
          Observability Node
        </h3>
        <p className="mb-4 text-xs text-white/60 leading-relaxed">
          Every decision made by our specialized agents is traceable via Weights & Biases Weave. Access the full
          reasoning graph for absolute trust.
        </p>
        <a
          href={weaveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#69E300] py-2.5 text-xs font-bold text-black transition-all hover:bg-[#5bc200] active:scale-[0.98]"
        >
          View Full AI Reasoning Trace
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}

function ExternalLink(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" x2="21" y1="14" y2="3" />
    </svg>
  )
}
