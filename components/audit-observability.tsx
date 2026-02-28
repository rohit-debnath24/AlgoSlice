import { Search, ExternalLink, Zap } from "lucide-react"

export function AuditObservability() {
  return (
    <div className="rounded-xl border border-[#69E300]/20 bg-[#69E300]/5 p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-[#69E300]" />
            <h3 className="text-lg font-bold text-[#F8F7F8]">Observability & Trace Transparency</h3>
          </div>
          <p className="text-sm text-[#A1A1A1] leading-relaxed">
            Every AI decision is traceable and auditable. We log the full chain of thought, tool selection rationale,
            and execution results to Weights & Biases Weave for 100% observability.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="px-6 py-4 rounded-xl bg-[#0A0809] border border-[#222122] text-center">
            <p className="text-[10px] text-[#71717A] uppercase tracking-widest mb-1">Trace ID</p>
            <p className="font-mono text-sm text-[#69E300]">audit_f7a2_trace_9x</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-4 rounded-xl bg-[#69E300] text-black font-bold hover:bg-[#5bc200] transition-all shadow-[0_0_20px_rgba(105,227,0,0.2)]">
            <Zap className="h-4 w-4" />
            Open Full W&B Trace
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-white/5">
        <div className="space-y-1">
          <p className="text-[10px] text-[#71717A] uppercase tracking-widest">Model Latency</p>
          <p className="text-lg font-bold text-[#F8F7F8]">
            1.24s <span className="text-[10px] text-[#A1A1A1] font-normal italic">avg</span>
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-[#71717A] uppercase tracking-widest">Token Count</p>
          <p className="text-lg font-bold text-[#F8F7F8]">
            4,821 <span className="text-[10px] text-[#A1A1A1] font-normal italic">ctx</span>
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-[#71717A] uppercase tracking-widest">Tools invoked</p>
          <p className="text-lg font-bold text-[#F8F7F8]">
            27 <span className="text-[10px] text-[#A1A1A1] font-normal italic">calls</span>
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-[#71717A] uppercase tracking-widest">Agent Cost</p>
          <p className="text-lg font-bold text-[#F8F7F8]">
            $0.12 <span className="text-[10px] text-[#A1A1A1] font-normal italic">est</span>
          </p>
        </div>
      </div>
    </div>
  )
}
