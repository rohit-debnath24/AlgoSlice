import { Cpu, Shield, Code, BookOpen } from "lucide-react"

const NODES = [
  { id: "orch", name: "Orchestrator", icon: Cpu, start: "0s", duration: "1.2s", tools: 4, active: false },
  { id: "sec", name: "Security Auditor", icon: Shield, start: "1.2s", duration: "4.5s", tools: 12, active: true },
  { id: "run", name: "Runtime Validator", icon: Code, start: "5.7s", duration: "8.1s", tools: 8, active: false },
  { id: "ghost", name: "Ghostwriter", icon: BookOpen, start: "13.8s", duration: "2.4s", tools: 3, active: false },
]

export function TraceTimeline() {
  return (
    <div className="relative pt-4 pb-8">
      <div className="absolute top-[52px] left-0 right-0 h-px bg-[#222122]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {NODES.map((node) => {
          const Icon = node.icon
          return (
            <div key={node.id} className="group cursor-pointer">
              <div
                className={`flex flex-col p-4 rounded-xl border transition-all duration-300 ${
                  node.active
                    ? "bg-[#69E300]/5 border-[#69E300] shadow-[0_0_20px_rgba(105,227,0,0.1)]"
                    : "bg-[#171717] border-[#222122] hover:border-[#A1A1A1]/30"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                      node.active ? "bg-[#69E300] text-black" : "bg-[#202023] text-[#71717A] group-hover:text-[#F8F7F8]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-[#A1A1A1]">{node.duration}</p>
                    <p className="text-[9px] text-[#71717A] uppercase tracking-widest">{node.tools} tools</p>
                  </div>
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${node.active ? "text-[#F8F7F8]" : "text-[#A1A1A1]"}`}>
                    {node.name}
                  </h4>
                  <p className="text-[10px] text-[#71717A] font-mono mt-1">Starts at {node.start}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
