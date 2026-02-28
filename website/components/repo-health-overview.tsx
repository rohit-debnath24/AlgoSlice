import { ShieldCheck, Activity, FileText, Zap, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface RepoHealthOverviewProps {
  repository: {
    health?: number
    status: string
  }
  audits: any[]
}

export function RepoHealthOverview({ repository, audits }: RepoHealthOverviewProps) {
  // Calculate metrics from actual data
  const calculateMetrics = () => {
    const totalAudits = audits.length;

    // Security Metrics: Based on vulnerabilities found
    // Base 100, deduct 20 for CRITICAL/HIGH, 10 for MEDIUM/Issues
    const securityScore = audits.reduce((acc, audit) => {
      let deduction = 0;
      const status = audit.result?.status;

      if (status === 'error' || status === 'failed') {
        deduction = 20;
      } else if (status === 'issues') {
        deduction = 10;
      }

      // Try parsing detailed security data
      const secData = audit.security_snapshot || audit.result?.security_analysis;
      if (secData) {
        try {
          const secObj = typeof secData === 'string' ? JSON.parse(secData) : secData;
          if (secObj.vulnerabilities?.length > 0) {
            deduction = Math.min(secObj.vulnerabilities.length * 10, 50); // Cap deduction per PR
          }
        } catch (e) { }
      }

      return acc - deduction;
    }, 100 * (totalAudits || 1));

    // Normalize back to 0-100 scale
    const finalSecurityHealth = totalAudits > 0 ? Math.max(0, Math.round(securityScore / totalAudits)) : 100;

    // Stability: Runtime pass rate
    // Parse runtime snapshot steps
    const passedStepsCount = audits.reduce((acc, audit) => {
      const runData = audit.runtime_snapshot || audit.result?.runtime_validation;
      let passed = 0;
      let total = 0;
      if (runData) {
        try {
          const runObj = typeof runData === 'string' ? JSON.parse(runData) : runData;
          const steps = runObj.steps || runObj.test_results;
          if (steps && Array.isArray(steps)) {
            passed = steps.filter((s: any) => s.status === 'PASS' || s.status === 'passed').length;
            total = steps.length;
          }
        } catch (e) { }
      }
      // Fallback if no detailed steps but overall audit success
      if (total === 0) {
        return audit.result?.status === 'success' ? acc + 1 : acc;
      }
      return acc + (total > 0 ? (passed / total) : 0);
    }, 0);

    // If we count by steps, we average the % per PR. If fallback, we average binary success.
    // Simplifying: average of (passed_steps/total_steps) per PR
    const stability = totalAudits > 0 ? Math.round((passedStepsCount / totalAudits) * 100) : 100;

    // Docs Coverage: simple heuristic if docs are present or not missing
    const docsScore = audits.reduce((acc, audit) => {
      const docData = audit.result?.documentation_status;
      let isGood = 0;
      if (audit.result?.comment?.toLowerCase().includes('doc')) isGood = 1;

      if (docData) {
        try {
          const docObj = typeof docData === 'string' ? JSON.parse(docData) : docData;
          if (docObj.missing_docs && docObj.missing_docs.length === 0) isGood = 1;
          else if (docObj.missing_docs && docObj.missing_docs.length > 0) isGood = 0;
        } catch (e) { }
      }
      return acc + isGood;
    }, 0);
    const docsCoverage = totalAudits > 0 ? Math.round((docsScore / totalAudits) * 100) : 100;

    // AI Confidence
    const avgConfidence = totalAudits > 0
      ? Math.round(audits.reduce((acc, a) => acc + ((a.result?.confidence_score || 0.85) * 100), 0) / totalAudits)
      : 95

    return {
      securityHealth: finalSecurityHealth,
      stability: stability,
      docsCoverage: docsCoverage,
      aiConfidence: avgConfidence
    }
  }

  const metrics = calculateMetrics()

  const METRICS = [
    {
      label: "Security Health",
      value: metrics.securityHealth.toString(),
      trend: "+2.4%",
      up: true,
      icon: ShieldCheck,
      description: "Vulnerability-free code segments",
    },
    {
      label: "Code Stability",
      value: `${metrics.stability}%`,
      trend: "+0.5%",
      up: metrics.stability >= 85,
      icon: Activity,
      description: "Runtime validation pass rate",
    },
    {
      label: "Docs Coverage",
      value: `${metrics.docsCoverage}%`,
      trend: "-1.2%",
      up: metrics.docsCoverage >= 80,
      icon: FileText,
      description: "Auto-generated documentation",
    },
    {
      label: "AI Confidence",
      value: metrics.aiConfidence.toString(),
      trend: "+1.1%",
      up: true,
      icon: Zap,
      description: "Aggregated agent certainty",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {METRICS.map((metric) => (
        <div
          key={metric.label}
          className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#171717] p-5 transition-all hover:bg-[#1a1a1a]"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#69E300]/10 border border-[#69E300]/20 text-[#69E300]">
              <metric.icon className="h-5 w-5" />
            </div>
            <div
              className={cn(
                "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md",
                metric.up ? "text-[#69E300] bg-[#69E300]/5" : "text-red-500 bg-red-500/5",
              )}
            >
              {metric.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {metric.trend}
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/30">{metric.label}</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white group-hover:text-[#69E300] transition-colors">
                {metric.value}
              </span>
              {metric.label.includes("Health") || metric.label.includes("Confidence") ? (
                <span className="text-xs font-medium text-white/20">/ 100</span>
              ) : null}
            </div>
            <p className="text-[11px] font-medium text-white/40">{metric.description}</p>
          </div>

          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full bg-[#69E300] transition-all duration-1000 group-hover:shadow-[0_0_10px_rgba(105,227,0,0.5)]"
              style={{ width: `${metric.value.replace("%", "")}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
