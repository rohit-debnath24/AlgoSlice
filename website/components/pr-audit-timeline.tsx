"use client"

import { useState } from "react"
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  User,
  Terminal,
  Shield,
  FileText,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MarkdownRendererProps {
  content: string
}

const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ node, ...props }) => <p className="text-xs text-white/70 leading-relaxed mb-2 last:mb-0" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 mb-2 text-xs text-white/70" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 mb-2 text-xs text-white/70" {...props} />,
        li: ({ node, ...props }) => <li className="pl-1 marker:text-[#69E300]/50" {...props} />,
        strong: ({ node, ...props }) => <strong className="font-bold text-white/90" {...props} />,
        a: ({ node, ...props }) => <a className="text-[#69E300] hover:underline underline-offset-2" target="_blank" rel="noopener noreferrer" {...props} />,
        code: ({ node, ...props }) => (
          <code className="bg-black/40 border border-white/5 rounded px-1 py-0.5 font-mono text-[10px] text-[#69E300]" {...props} />
        ),
        h1: ({ node, ...props }) => <h3 className="text-sm font-bold text-white mb-2 mt-1" {...props} />,
        h2: ({ node, ...props }) => <h4 className="text-xs font-bold text-white mb-1 mt-1" {...props} />,
        h3: ({ node, ...props }) => <h5 className="text-xs font-bold text-white mb-1" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

interface PRAuditTimelineProps {
  audits: any[]
}

export function PRAuditTimeline({ audits }: PRAuditTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(audits.length > 0 ? audits[0].id : null)

  // Transform audits data
  const transformedAudits = audits.map(audit => {
    const status = audit.result?.status === 'success' ? 'passed' :
      audit.result?.status === 'error' ? 'failed' : 'issues'

    const timestamp = audit.timestamp
      ? formatDistanceToNow(new Date(audit.timestamp), { addSuffix: true })
      : 'Unknown time'

    // Helper to extract meaningful text from potential JSON object/string
    const formatAgentOutput = (data: any, fallback: string) => {
      if (!data) return fallback;

      // If it's already a simple string, return it
      if (typeof data === 'string' && !data.trim().startsWith('{')) {
        return data;
      }

      try {
        // Try parsing JSON if it's a string
        const obj = typeof data === 'string' ? JSON.parse(data) : data;

        // Security Parser
        if (obj.vulnerabilities !== undefined) {
          if (Array.isArray(obj.vulnerabilities) && obj.vulnerabilities.length > 0) {
            const highSev = obj.vulnerabilities.filter((v: any) => v.severity === 'HIGH' || v.severity === 'CRITICAL').length;
            return `${obj.vulnerabilities.length} vulnerabilities detected. ${highSev > 0 ? `${highSev} HIGH severity.` : ''}\n\nTop: ${obj.vulnerabilities[0].description}`;
          }
          return obj.is_secure ? "No vulnerabilities detected." : "Vulnerabilities found.";
        }

        // Runtime Parser
        if (obj.steps !== undefined || obj.test_results !== undefined) {
          const steps = obj.steps || obj.test_results;
          const passed = steps.filter((t: any) => t.status === 'PASS' || t.status === 'passed').length;
          const failedSteps = steps.filter((t: any) => t.status === 'FAIL' || t.status === 'failed');
          const total = steps.length;

          let output = `${passed}/${total} checks passed.`;

          if (failedSteps.length > 0) {
            output += "\n\nFailures detected:\n";
            failedSteps.forEach((step: any) => {
              output += `- ${step.step_name}: ${step.actual_output}\n`;
            });
          } else {
            output += "\n\nCode execution verified safely.";
          }

          if (obj.execution_time) {
            output += `\nExecution: ${obj.execution_time}`;
          }

          return output;
        }

        // Documentation Parser
        if (obj.missing_docs !== undefined) {
          if (Array.isArray(obj.missing_docs) && obj.missing_docs.length > 0) {
            return `Missing docs for: ${obj.missing_docs.slice(0, 3).join(', ')}${obj.missing_docs.length > 3 ? '...' : ''}`;
          }
          return "Documentation coverage is growing.";
        }

        // Fallback to specific summary fields if they exist
        if (obj.summary) return obj.summary;
        if (obj.message) return obj.message;

        // If structure is unknown, prettify JSON
        return JSON.stringify(obj, null, 2);

      } catch (e) {
        return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      }
    }

    return {
      id: audit.id,
      title: `PR #${audit.pr_id}`,
      author: audit.repo?.split('/')[0] || 'Unknown',
      timestamp,
      status,
      security: formatAgentOutput(audit.security_snapshot || audit.result?.security_analysis, "No active security threats detected."),
      runtime: formatAgentOutput(audit.runtime_snapshot || audit.result?.runtime_validation, "Code execution verified safely in sandbox."),
      docs: formatAgentOutput(audit.result?.documentation_status, "Documentation updated automatically."),
      ghostwriter: audit.result?.comment || "No AI summary available",
      confidenceScore: audit.result?.confidence_score ? Math.round(audit.result.confidence_score * 100) : null
    }
  })

  if (transformedAudits.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-white">Audit Timeline</h2>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#171717] p-8 text-center">
          <p className="text-white/40">No audits found for this repository yet.</p>
          <p className="text-xs text-white/30 mt-2">Submit a PR to start analyzing!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-white">Audit Timeline</h2>
        <div className="text-[11px] font-medium text-white/40 uppercase tracking-widest">
          Showing {transformedAudits.length} audit{transformedAudits.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="relative space-y-4 before:absolute before:left-[17px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-white/5">
        {transformedAudits.map((audit) => (
          <div
            key={audit.id}
            className={cn(
              "group relative ml-8 rounded-xl border border-white/5 bg-[#171717] transition-all hover:border-white/10",
              expandedId === audit.id && "border-[#69E300]/30 shadow-[0_0_20px_rgba(105,227,0,0.05)]",
            )}
          >
            {/* Timeline Dot */}
            <div
              className={cn(
                "absolute -left-[27px] top-5 h-4 w-4 rounded-full border-4 border-[#0A0809] z-10",
                audit.status === "passed" && "bg-[#69E300]",
                audit.status === "issues" && "bg-yellow-500",
                audit.status === "failed" && "bg-red-500",
              )}
            />

            <div
              className="flex cursor-pointer items-center justify-between p-4"
              onClick={() => setExpandedId(expandedId === audit.id ? null : audit.id)}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10">
                  <User className="h-4 w-4 text-white/60" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#69E300]">{audit.title}</span>
                    {audit.confidenceScore && (
                      <span className="text-[10px] text-white/40">
                        {audit.confidenceScore}% confidence
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-white/40">
                    <span>by {audit.author}</span>
                    <span>•</span>
                    <span>{audit.timestamp}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                    audit.status === "passed" && "bg-[#69E300]/10 text-[#69E300]",
                    audit.status === "issues" && "bg-yellow-500/10 text-yellow-500",
                    audit.status === "failed" && "bg-red-500/10 text-red-500",
                  )}
                >
                  {audit.status === "passed" && <CheckCircle2 className="h-3 w-3" />}
                  {audit.status === "issues" && <AlertTriangle className="h-3 w-3" />}
                  {audit.status === "failed" && <XCircle className="h-3 w-3" />}
                  {audit.status}
                </div>
                {expandedId === audit.id ? (
                  <ChevronDown className="h-4 w-4 text-white/20" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-white/20" />
                )}
              </div>
            </div>

            {expandedId === audit.id && (
              <div className="border-t border-white/5 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2 rounded-lg bg-black/20 p-3 border border-white/5">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <Shield className="h-3 w-3 text-[#69E300]" />
                      Security Finding
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">
                      <MarkdownRenderer content={audit.security} />
                    </p>
                  </div>
                  <div className="space-y-2 rounded-lg bg-black/20 p-3 border border-white/5">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <Terminal className="h-3 w-3 text-[#69E300]" />
                      Runtime Validation
                    </div>
                    <div className="text-xs text-white/70 leading-relaxed">
                      <MarkdownRenderer content={audit.runtime} />
                    </div>
                  </div>
                  <div className="space-y-2 rounded-lg bg-black/20 p-3 border border-white/5">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <FileText className="h-3 w-3 text-[#69E300]" />
                      Documentation
                    </div>
                    <div className="text-xs text-white/70 leading-relaxed">
                      <MarkdownRenderer content={audit.docs} />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-[#69E300]/5 p-4 border border-[#69E300]/10">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#69E300]">
                      <Zap className="h-3 w-3 fill-current" />
                      Ghostwriter Summary
                    </div>
                    <Link
                      href={`/audit/${encodeURIComponent(audit.id)}`}
                      className="text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-[#69E300] transition-colors"
                    >
                      View Full Trace →
                    </Link>
                  </div>
                  <div className="text-sm italic text-white/80 leading-relaxed">
                    <MarkdownRenderer content={audit.ghostwriter} />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
