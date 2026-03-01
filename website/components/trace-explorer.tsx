"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Search, Info, Braces, AlignLeft, AlertCircle } from "lucide-react"

interface Span {
  id: string
  name: string
  type: "orchestrator" | "agent" | "tool" | "reasoning" | "code"
  status: "success" | "error" | "running"
  duration: string
  children?: Span[]
}

const TRACE_TREE: Span[] = [
  {
    id: "root",
    name: "PR Audit Trace #842",
    type: "orchestrator",
    status: "success",
    duration: "18.4s",
    children: [
      {
        id: "orch-init",
        name: "Ghostwriter Orchestrator",
        type: "agent",
        status: "success",
        duration: "1.2s",
        children: [{ id: "ctx-load", name: "Load PR Context", type: "tool", status: "success", duration: "240ms" }],
      },
      {
        id: "sec-audit",
        name: "Security Auditor Agent",
        type: "agent",
        status: "success",
        duration: "4.5s",
        children: [
          {
            id: "sec-reasoning",
            name: "Analyzing Vulnerability Surface",
            type: "reasoning",
            status: "success",
            duration: "1.1s",
          },
          { id: "tool-semgrep", name: "semgrep: scan-filesystem", type: "tool", status: "success", duration: "3.2s" },
        ],
      },
      {
        id: "run-val",
        name: "Runtime Validator Agent",
        type: "agent",
        status: "success",
        duration: "8.1s",
        children: [
          {
            id: "run-reasoning",
            name: "Evaluating Test Coverage",
            type: "reasoning",
            status: "success",
            duration: "800ms",
          },
          { id: "tool-npm-test", name: "npm test: --coverage", type: "code", status: "success", duration: "7.1s" },
        ],
      },
    ],
  },
]

export function TraceExplorer() {
  const [selectedSpanId, setSelectedSpanId] = useState("sec-reasoning")
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["root", "sec-audit"]))

  const toggleExpand = (id: string) => {
    const next = new Set(expandedNodes)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedNodes(next)
  }

  const renderTree = (span: Span, depth = 0) => {
    const isExpanded = expandedNodes.has(span.id)
    const isSelected = selectedSpanId === span.id
    const hasChildren = span.children && span.children.length > 0

    return (
      <div key={span.id}>
        <div
          onClick={() => {
            setSelectedSpanId(span.id)
            if (hasChildren) toggleExpand(span.id)
          }}
          className={`group flex items-center gap-2 py-2 px-3 cursor-pointer rounded-lg transition-colors ${
            isSelected ? "bg-[#69E300]/10" : "hover:bg-[#171717]"
          }`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-3 w-3 text-[#71717A]" />
              ) : (
                <ChevronRight className="h-3 w-3 text-[#71717A]" />
              )
            ) : (
              <div className="w-3" />
            )}
            <div className={`h-1.5 w-1.5 rounded-full ${span.status === "success" ? "bg-[#69E300]" : "bg-red-500"}`} />
            <span
              className={`text-[13px] font-medium truncate ${isSelected ? "text-[#69E300]" : "text-[#A1A1A1] group-hover:text-[#F8F7F8]"}`}
            >
              {span.name}
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#71717A] opacity-0 group-hover:opacity-100 transition-opacity">
            {span.duration}
          </span>
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-0.5">{span.children?.map((child) => renderTree(child, depth + 1))}</div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 rounded-xl border border-[#222122] bg-[#0A0809] overflow-hidden min-h-[600px]">
      {/* Left Panel - Tree View */}
      <div className="lg:col-span-5 border-r border-[#222122] flex flex-col">
        <div className="p-4 border-b border-[#222122] bg-[#171717] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-[#71717A]" />
            <span className="text-[10px] font-bold text-[#A1A1A1] uppercase tracking-[0.2em]">Trace Tree</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10">
          {TRACE_TREE.map((root) => renderTree(root))}
        </div>
      </div>

      {/* Right Panel - Details */}
      <div className="lg:col-span-7 flex flex-col bg-[#171717]">
        <div className="px-6 py-4 border-b border-[#222122] bg-[#202023] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-[#69E300]/10 flex items-center justify-center border border-[#69E300]/30">
              <Info className="h-4 w-4 text-[#69E300]" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-[#F8F7F8]">Span Details</h3>
              <p className="text-[10px] text-[#71717A] font-mono">id: {selectedSpanId}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10">
          {/* Metadata Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#69E300]">
              <AlignLeft className="h-4 w-4" />
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em]">Execution Context</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-[#0A0809] border border-[#222122]">
                <p className="text-[10px] text-[#71717A] uppercase font-bold tracking-tighter mb-1">Agent / Model</p>
                <p className="text-[12px] text-[#F8F7F8] font-medium">Security Auditor • GPT-4o</p>
              </div>
              <div className="p-3 rounded-lg bg-[#0A0809] border border-[#222122]">
                <p className="text-[10px] text-[#71717A] uppercase font-bold tracking-tighter mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#69E300]" />
                  <p className="text-[12px] text-[#F8F7F8] font-medium">COMPLETED_SUCCESS</p>
                </div>
              </div>
            </div>
          </section>

          {/* Reasoning Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#69E300]">
              <AlertCircle className="h-4 w-4" />
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em]">Reasoning Trace</h4>
            </div>
            <div className="p-4 rounded-lg bg-[#0A0809] border border-[#222122] space-y-3">
              <p className="text-[13px] text-[#A1A1A1] leading-relaxed italic">
                &ldquo;Reviewing code changes in `src/auth/session.ts`. The implementation uses a new token verification
                mechanism. Scanning for potential side-channel timing attacks in the string comparison logic. Initial
                semgrep results confirm safe constant-time comparison.&rdquo;
              </p>
            </div>
          </section>

          {/* Tool I/O Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#69E300]">
              <Braces className="h-4 w-4" />
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em]">Tool Input / Output</h4>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-[#71717A] uppercase font-bold tracking-tighter mb-2">Input Parameters</p>
                <pre className="p-4 rounded-lg bg-[#0A0809] border border-[#222122] text-[12px] text-[#69E300] font-mono overflow-x-auto">
                  {`{
  "target_path": "src/auth/session.ts",
  "rule_set": "security-best-practices",
  "timeout": 300
}`}
                </pre>
              </div>
              <div>
                <p className="text-[10px] text-[#71717A] uppercase font-bold tracking-tighter mb-2">Output Result</p>
                <pre className="p-4 rounded-lg bg-[#0A0809] border border-[#222122] text-[12px] text-white/60 font-mono overflow-x-auto">
                  {`{
  "vulnerabilities_found": 0,
  "files_scanned": 1,
  "execution_time": "3.2s",
  "hash": "8f3e2a..."
}`}
                </pre>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
