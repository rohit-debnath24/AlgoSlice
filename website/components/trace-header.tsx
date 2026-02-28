import { ExternalLink, Clock, Database, CircleDollarSign, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TraceHeaderProps {
  id: string
}

export function TraceHeader({ id }: TraceHeaderProps) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between pb-8 border-b border-[#222122]">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="px-2 py-0.5 rounded bg-[#171717] border border-[#222122]">
            <span className="text-[10px] font-mono font-bold text-[#69E300] uppercase tracking-widest">Trace ID</span>
          </div>
          <h1 className="text-xl font-mono font-bold text-[#F8F7F8] leading-none">{id}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-[#A1A1A1]">
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5" />
            <span className="font-medium text-[#F8F7F8]">ghostwriter-core-api</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5" />
            <span>PR #842</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Oct 24, 2025 • 14:20:01</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#69E300]/5 border border-[#69E300]/20">
            <div className="h-1.5 w-1.5 rounded-full bg-[#69E300]" />
            <span className="text-[#69E300] font-bold">gpt-4o-2024-08-06</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-6 px-6 py-3 rounded-lg bg-[#171717] border border-[#222122]">
          <div className="text-center">
            <p className="text-[10px] text-[#71717A] uppercase font-bold tracking-tighter">Latency</p>
            <p className="text-lg font-mono font-bold text-[#F8F7F8]">18.4s</p>
          </div>
          <div className="w-px h-8 bg-[#222122]" />
          <div className="text-center">
            <p className="text-[10px] text-[#71717A] uppercase font-bold tracking-tighter">Tokens</p>
            <p className="text-lg font-mono font-bold text-[#F8F7F8]">42.8k</p>
          </div>
          <div className="w-px h-8 bg-[#222122]" />
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <CircleDollarSign className="h-3 w-3 text-[#69E300]" />
              <p className="text-[10px] text-[#71717A] uppercase font-bold tracking-tighter">Est. Cost</p>
            </div>
            <p className="text-lg font-mono font-bold text-[#69E300]">$0.12</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-[#222122] bg-transparent text-[#A1A1A1] hover:border-[#69E300] hover:text-[#69E300] transition-all"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Open in W&B
        </Button>
      </div>
    </div>
  )
}
