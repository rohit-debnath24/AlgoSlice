"use client"

import { useEffect, useState, useRef } from "react"
import { Terminal, Check, Shield, Code, GitBranch, BookOpen } from "lucide-react"

const LOGS = [
  { text: "Initializing ADK agent cluster...", type: "system" },
  { text: "Cloning repository: ghostwriter-core", type: "action", icon: GitBranch },
  { text: "Analyzing 12,450 lines of code...", type: "process" },
  { text: "Executing security sandbox #842...", type: "process", icon: Shield },
  { text: "ADK: Critical vulnerability patched in auth middleware.", type: "success", icon: Check },
  { text: "Weights & Biases: Tracking reasoning trace #f7a2...", type: "system" },
  { text: "Generating technical docs: security-posture.md", type: "action", icon: BookOpen },
  { text: "Ghostwriting unit tests for /api/v1/auth...", type: "action", icon: Code },
  { text: "Sandbox cleanup complete. Report finalized.", type: "success", icon: Check },
]

export function LiveTerminal() {
  const [visibleLogs, setVisibleLogs] = useState<number[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      if (index < LOGS.length) {
        setVisibleLogs((prev) => [...prev, index])
        index++
      } else {
        setTimeout(() => {
          setVisibleLogs([])
          index = 0
        }, 3000)
      }
    }, 1500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-[#0a0809] shadow-2xl">
      <div className="flex items-center gap-2 border-b border-white/5 bg-[#171717] px-4 py-2">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/50" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
          <div className="h-3 w-3 rounded-full bg-green-500/50" />
        </div>
        <div className="ml-2 flex items-center gap-2 text-[10px] font-medium text-white/40 uppercase tracking-widest">
          <Terminal className="h-3 w-3" />
          Autonomous Agent Log
        </div>
      </div>

      <div ref={containerRef} className="h-[300px] overflow-y-auto p-4 font-mono text-[13px] leading-relaxed">
        {visibleLogs.map((logIndex) => {
          const log = LOGS[logIndex]
          if (!log) return null

          const Icon = log.icon
          return (
            <div
              key={logIndex}
              className={`mb-2 flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-500 ${
                log.type === "success" ? "text-[#69E300]" : log.type === "system" ? "text-white/40" : "text-white/80"
              }`}
            >
              <span className="shrink-0 text-white/20">
                [
                {new Date().toLocaleTimeString([], {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
                ]
              </span>
              <div className="flex items-center gap-2">
                {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
                <span>{log.text}</span>
              </div>
            </div>
          )
        })}
        {visibleLogs.length < LOGS.length && <div className="inline-block h-4 w-2 animate-pulse bg-[#69E300]/50" />}
      </div>
    </div>
  )
}
