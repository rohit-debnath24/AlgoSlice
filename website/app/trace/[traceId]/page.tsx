import { Navigation } from "@/components/navigation"
import { TraceHeader } from "@/components/trace-header"
import { TraceTimeline } from "@/components/trace-timeline"
import { TraceExplorer } from "@/components/trace-explorer"
import { TraceAnalytics } from "@/components/trace-analytics"
import { TraceSecurityCompliance } from "@/components/trace-security-compliance"

export default async function TracePage({ params }: { params: { traceId: string } }) {
  const { traceId } = await params

  return (
    <main className="min-h-screen bg-[#0A0809] pb-20">
      <Navigation />

      <div className="container mx-auto px-4 pt-32 space-y-12">
        {/* Header & Meta */}
        <section className="animate-in fade-in slide-in-from-top-4 duration-700">
          <TraceHeader id={traceId} />
        </section>

        {/* High Level Flow */}
        <section className="animate-in fade-in slide-in-from-top-4 duration-700 delay-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-px flex-1 bg-[#222122]" />
            <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-[0.4em] px-4">Execution Flow</span>
            <div className="h-px flex-1 bg-[#222122]" />
          </div>
          <TraceTimeline />
        </section>

        {/* Analytics Summary */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <TraceAnalytics />
        </section>

        {/* Detailed Explorer */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-xs font-bold text-[#F8F7F8] uppercase tracking-[0.2em]">Detailed Reasoning Explorer</h3>
            <div className="h-px flex-1 bg-[#222122]" />
          </div>
          <TraceExplorer />
        </section>

        {/* Compliance & Integrity */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
          <TraceSecurityCompliance />
        </section>
      </div>

      <footer className="mt-20 border-t border-white/5 py-12 text-center">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-[#69E300]/10 flex items-center justify-center border border-[#69E300]/20">
                <div className="h-3 w-3 rounded-full bg-[#69E300]" />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">Ghostwriter Intelligence Platform</span>
            </div>
            <p className="text-xs text-white/20 uppercase tracking-[0.2em] font-medium">
              Forensic AI Trace • Immutable Integrity • Verified by W&B Weave
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
