import { ExternalLink, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface RepoHeaderProps {
  repository: {
    id: number
    name: string
    description?: string
    owner: string
    fullName: string
    url: string
    branch: string
    lastAnalyzed?: Date
    stars: number
    forks: number
  }
  totalPRs?: number
  username?: string
}

export function RepoHeader({ repository, totalPRs = 0, username }: RepoHeaderProps) {
  const lastScanned = repository.lastAnalyzed
    ? formatDistanceToNow(new Date(repository.lastAnalyzed), { addSuffix: true })
    : "Never"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          {username && (
            <h3 className="text-2xl font-bold text-white/50">
              Welcome back, <span className="text-[#69E300] font-bold">{username}</span>!
            </h3>
          )}
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-white">{repository.name}</h1>
            <div className="flex items-center gap-1.5 rounded-full bg-[#69E300]/10 px-2 py-0.5 border border-[#69E300]/20">
              <div className="h-1.5 w-1.5 rounded-full bg-[#69E300] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#69E300]">Connected</span>
            </div>
          </div>
          <p className="text-sm text-white/60 max-w-2xl">
            {repository.description || "No description available"}
          </p>
          <p className="text-xs text-white/40">
            Branch: <span className="font-mono text-white/60">{repository.branch}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            asChild
          >
            <Link href={repository.url} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              View on GitHub
            </Link>
          </Button>
          <Button size="sm" className="bg-[#69E300] text-black hover:bg-[#5bc200] font-bold">
            <Play className="mr-2 h-4 w-4 fill-current" />
            Trigger Manual Audit
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-y border-white/5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Last Scanned</span>
          <span className="text-xs font-medium text-white/60">{lastScanned}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Total PRs</span>
          <span className="text-xs font-medium text-white/60">{totalPRs} analyzed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Active Agents</span>
          <span className="text-xs font-medium text-white/60">4 specialized units</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Stars</span>
          <span className="text-xs font-medium text-white/60">{repository.stars}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Forks</span>
          <span className="text-xs font-medium text-white/60">{repository.forks}</span>
        </div>
      </div>
    </div>
  )
}
