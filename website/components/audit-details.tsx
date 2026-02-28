import { Badge } from "@/components/ui/badge"
import { Clock, Database, FileText, Clipboard, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { MarkdownRenderer } from "@/components/markdown-renderer"

interface AuditDetailsProps {
  data: any
}

export function AuditDetails({ data }: AuditDetailsProps) {
  const runtime = data?.runtime_snapshot
  const steps = runtime?.steps || []
  const ghostwriterComment = data?.result?.comment || "Analysis pending..."

  const passedCount = steps.filter((s: any) => s.status === 'PASS').length
  const totalCount = steps.length
  const isRuntimeSuccess = runtime?.final_verdict === 'PASS'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
      {/* Runtime Validation */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-[#69E300]" />
          <h3 className="text-sm font-bold text-[#F8F7F8] uppercase tracking-[0.2em]">Runtime Validation</h3>
        </div>

        <div className="rounded-xl border border-[#222122] bg-[#171717] overflow-hidden">
          <div className="p-6 border-b border-[#222122]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Badge className={`${isRuntimeSuccess ? 'bg-[#69E300]/10 text-[#69E300] border-[#69E300]/20' : 'bg-red-500/10 text-red-500 border-red-500/20'} font-bold text-[10px] tracking-widest uppercase`}>
                  {runtime?.final_verdict || 'PENDING'}
                </Badge>
                <h4 className="font-bold text-[#F8F7F8]">Test Suite Execution</h4>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#A1A1A1]">
                <Clock className="h-3 w-3" />
                <span>Simulated Execution</span>
              </div>
            </div>
            <p className="text-sm text-[#A1A1A1] italic mb-4">
              "Executed in Gemini Sandbox Environment"
            </p>
            <div className="rounded-lg bg-[#0A0809] border border-[#222122] p-4 font-mono text-[12px] text-[#F8F7F8] space-y-2">
              <p className="text-white/20 mb-2 border-b border-white/10 pb-2">Running validation steps...</p>

              {steps.length === 0 && <p className="text-white/40">No validation steps recorded.</p>}

              {steps.map((step: any, idx: number) => (
                <div key={idx} className="flex gap-2 items-start">
                  {step.status === 'PASS' ?
                    <CheckCircle2 className="h-4 w-4 text-[#69E300] shrink-0" /> :
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  }
                  <div>
                    <p className={step.status === 'PASS' ? "text-white/90" : "text-red-400"}>
                      {step.step_name}: {step.description}
                    </p>
                    <p className="text-[10px] text-white/30 pl-1">
                      Expected: {step.expected_output} | Actual: {step.actual_output}
                    </p>
                  </div>
                </div>
              ))}

              <p className={`pt-2 border-t border-white/10 mt-2 font-bold ${isRuntimeSuccess ? 'text-[#69E300]' : 'text-red-500'}`}>
                Result: {passedCount} passed, {totalCount - passedCount} failed, {totalCount} total
              </p>
            </div>

            {runtime?.error_recovery_attempted && (
              <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg flex gap-2 items-start">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-500">Self-Correction Attempted</p>
                  <p className="text-[10px] text-red-400/80 mt-1">{runtime.recovery_trace}</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Ghostwriter Documentation */}
      <div className="lg:col-span-5 space-y-6">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#69E300]" />
          <h3 className="text-sm font-bold text-[#F8F7F8] uppercase tracking-[0.2em]">Ghostwriter Output</h3>
        </div>

        <div className="rounded-xl border border-[#222122] bg-[#171717] overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-[#F8F7F8]">Generated PR Comment</h4>
              <button className="text-[#A1A1A1] hover:text-[#69E300] transition-colors">
                <Clipboard className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-lg bg-[#0A0809] border border-[#222122] p-4 text-[11px] text-[#A1A1A1] space-y-3 h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              <MarkdownRenderer content={ghostwriterComment} />
            </div>
            <button className="w-full mt-6 py-2 rounded-lg bg-[#202023] border border-[#262626] text-[11px] font-bold text-[#F8F7F8] hover:border-[#69E300] transition-colors">
              Preview README Diffs
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
