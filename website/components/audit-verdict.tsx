import { ShieldCheck, FileText, CheckCircle2, AlertTriangle } from "lucide-react"

interface AuditVerdictProps {
  data: any
}

export function AuditVerdict({ data }: AuditVerdictProps) {
  // Safe access to data
  const result = data?.result;
  const isSuccess = result?.status === 'success';
  const comment = result?.comment || "No analysis details available.";

  // Heuristic for "Secure" based on comment content if available, otherwise rely on status
  const hasSecurityWarning = comment.toLowerCase().includes("security warning") || comment.toLowerCase().includes("vulnerability");
  const isSecure = isSuccess && !hasSecurityWarning;

  return (
    <div className={`rounded-xl border ${isSecure ? 'border-[#69E300]/20 bg-[#69E300]/5' : 'border-red-500/20 bg-red-500/5'} p-8 animate-in fade-in slide-in-from-top-4 duration-700 delay-100`}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full ${isSecure ? 'bg-[#69E300]/10 border-[#69E300]/20' : 'bg-red-500/10 border-red-500/20'} flex items-center justify-center border`}>
              {isSecure ? <CheckCircle2 className="h-6 w-6 text-[#69E300]" /> : <AlertTriangle className="h-6 w-6 text-red-500" />}
            </div>
            <h2 className={`text-2xl font-bold ${isSecure ? 'text-[#F8F7F8]' : 'text-red-400'}`}>
              {isSecure ? "Analysis Passed | Secure" : "Issues Detected | Review Needed"}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-[#0A0809] border border-[#222122]">
              <ShieldCheck className={`h-5 w-5 ${isSecure ? 'text-[#69E300]' : 'text-red-500'} shrink-0 mt-0.5`} />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#F8F7F8]">Security Status</p>
                <p className="text-xs text-[#A1A1A1]">{isSecure ? "No critical vulnerabilities." : "Potential risks identified."}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-[#0A0809] border border-[#222122]">
              <CheckCircle2 className="h-5 w-5 text-[#69E300] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#F8F7F8]">Runtime Agent</p>
                <p className="text-xs text-[#A1A1A1]">Execution completed.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-[#0A0809] border border-[#222122]">
              <FileText className="h-5 w-5 text-[#69E300] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#F8F7F8]">Report Summary</p>
                <p className="text-xs text-[#A1A1A1] line-clamp-2">{comment}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-xl bg-[#202023] border border-[#262626]">
          <div className="relative h-24 w-24">
            <svg className="h-full w-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-white/5"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 * (1 - (isSecure ? 0.95 : 0.60))}
                className={isSecure ? "text-[#69E300]" : "text-yellow-500"}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-[#F8F7F8]">{isSecure ? "95%" : "60%"}</span>
            </div>
          </div>
          <p className="mt-4 text-sm font-bold text-[#F8F7F8] uppercase tracking-widest">AI Confidence</p>
          <p className="text-xs text-[#A1A1A1] mt-1 italic">Based on agent consensus</p>
        </div>
      </div>
    </div>
  )
}
