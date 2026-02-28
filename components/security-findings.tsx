import { Badge } from "@/components/ui/badge"
import { ShieldAlert, ExternalLink, CheckCircle } from "lucide-react"

interface SecurityFindingsProps {
  data: any
}

export function SecurityFindings({ data }: SecurityFindingsProps) {
  const findings = data?.security_snapshot?.vulnerabilities || []
  const summary = data?.security_snapshot?.summary_reasoning || "Analysis pending..."

  if (findings.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-[#69E300]" />
          <h3 className="text-sm font-bold text-[#F8F7F8] uppercase tracking-[0.2em]">Security Analysis</h3>
        </div>
        <div className="rounded-xl border border-[#222122] bg-[#171717] p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-[#69E300]/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-[#69E300]" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">No Vulnerabilities Detected</h3>
            <p className="text-white/60 mt-2 max-w-lg mx-auto">{summary}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-red-500" />
        <h3 className="text-sm font-bold text-[#F8F7F8] uppercase tracking-[0.2em]">Security Analysis</h3>
      </div>

      <div className="grid gap-4">
        {findings.map((finding: any, index: number) => (
          <div key={index} className="rounded-xl border border-[#222122] bg-[#171717] overflow-hidden group">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <Badge
                    className={`
                    ${finding.severity === "Critical"
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : finding.severity === "Medium" || finding.severity === "High"
                          ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                          : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      } 
                    px-2 py-0 border font-bold uppercase text-[10px] tracking-widest
                  `}
                  >
                    {finding.severity}
                  </Badge>
                  <h4 className="text-lg font-bold text-[#F8F7F8] group-hover:text-red-400 transition-colors">
                    {finding.type}: {finding.description.substring(0, 50)}...
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-[#71717A]">
                  <span className="text-[#A1A1A1]">{finding.file_path || 'unknown file'}</span>
                  <span className="text-white/10">:</span>
                  <span>L{finding.line_number || '?'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <p className="text-xs font-bold text-[#A1A1A1] uppercase tracking-wider">Reasoning Path (Chain of Thought)</p>
                  <p className="text-sm text-[#F8F7F8] leading-relaxed italic border-l-2 border-white/10 pl-3">
                    {finding.reasoning_path}
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-bold text-[#A1A1A1] uppercase tracking-wider">Details</p>
                  <div className="p-3 rounded-lg bg-[#0A0809] border border-[#222122] font-mono text-[12px] text-white/70">
                    {finding.description}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 bg-[#202023] border-t border-[#262626] flex items-center justify-between">
              <p className="text-[11px] text-[#71717A]">
                Confidence Score: <span className="text-[#A1A1A1]">{finding.confidence_score * 100}%</span>
              </p>
              <button className="text-[11px] font-bold text-[#69E300] flex items-center gap-1 hover:underline">
                View trace details <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
