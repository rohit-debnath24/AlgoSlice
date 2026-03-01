import { ShieldCheck, Lock, EyeOff, FileKey } from "lucide-react"

export function TraceSecurityCompliance() {
  return (
    <div className="p-8 rounded-xl border border-[#222122] bg-[#171717] space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-[#69E300]" />
        <h3 className="text-xs font-bold text-[#F8F7F8] uppercase tracking-[0.2em]">Security & Compliance Report</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ComplianceItem
          icon={Lock}
          label="Data Isolation"
          status="Verified"
          description="Isolated execution runtime confirmed."
        />
        <ComplianceItem
          icon={EyeOff}
          label="Prompt Redaction"
          status="Active"
          description="PII and secrets filtered from logs."
        />
        <ComplianceItem
          icon={FileKey}
          label="Access Control"
          status="Restricted"
          description="No external write access detected."
        />
        <ComplianceItem
          icon={ShieldCheck}
          label="Trace Integrity"
          status="Immutable"
          description="Hash verified against chain of trust."
        />
      </div>

      <div className="pt-6 mt-6 border-t border-[#222122] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-mono text-[10px] text-[#71717A]">
          <span className="uppercase tracking-widest">Trace Hash:</span>
          <span className="text-white/40">sha256:8f3e2a9d1b4c7e6f5a0d9c8b7a6e5d4c3b2a1a0b9c8d7e6f5a4b3c2d1e0f9a8b</span>
        </div>
        <p className="text-[10px] text-[#71717A] italic">
          &ldquo;This trace is immutable and cryptographically sealed after execution.&rdquo;
        </p>
      </div>
    </div>
  )
}

function ComplianceItem({ icon: Icon, label, status, description }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#A1A1A1]" />
        <span className="text-[12px] font-bold text-[#F8F7F8]">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-[#69E300]" />
        <span className="text-[11px] font-medium text-[#69E300]">{status}</span>
      </div>
      <p className="text-[11px] text-[#71717A] leading-relaxed">{description}</p>
    </div>
  )
}
