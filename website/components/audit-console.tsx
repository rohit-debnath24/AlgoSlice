"use client"

import { Terminal } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AuditConsoleProps {
  data: any
}

export function AuditConsole({ data }: AuditConsoleProps) {
  // Use real data or fallback
  // Use real data or fallback
  const diffSnippet = data?.diff || "No diff data available."

  return (
    <div className="rounded-xl border border-[#333] bg-[#0A0809] overflow-hidden shadow-2xl">
      {/* Terminal Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1A1A1A] border-b border-[#333]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="ml-3 text-xs text-white/40 font-mono">agent-engine-v2.0.exe</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#69E300] font-mono animate-pulse">● LIVE CONNECTION</span>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex flex-col h-[400px]">
        {/* Input (Diff) */}
        <div className="p-0 flex flex-col h-full">
          <div className="px-4 py-2 border-b border-[#333] bg-[#111]">
            <span className="text-xs text-white/50 font-bold uppercase tracking-wider">Input Context: Git Diff</span>
          </div>
          <div className="flex-1 p-4 bg-[#0F0F0F] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            <pre className="text-xs font-mono text-white/70 leading-relaxed whitespace-pre-wrap">
              {diffSnippet}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
