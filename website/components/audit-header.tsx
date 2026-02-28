import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Github, RotateCcw, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface AuditHeaderProps {
  prId: string
  data: any
}

export function AuditHeader({ prId, data }: AuditHeaderProps) {
  if (!data) return null

  const repoParts = data.repo ? data.repo.split('/') : ['Unknown', 'Unknown']
  const owner = repoParts[0]
  const repoName = repoParts[1] || repoParts[0]
  const prNumber = data.pr_id || prId

  const status = data.result?.status === 'success' ? 'Passed' :
    data.result?.status === 'error' ? 'Failed' :
      data.result?.status === 'issues' ? 'Issues Found' : 'Unknown'

  const statusColor = status === 'Passed' ? 'text-[#69E300] bg-[#69E300]/10 border-[#69E300]/20' :
    status === 'Failed' ? 'text-red-500 bg-red-500/10 border-red-500/20' :
      'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'

  const statusDot = status === 'Passed' ? 'bg-[#69E300]' :
    status === 'Failed' ? 'bg-red-500' :
      'bg-yellow-500'

  return (
    <div className="flex flex-col gap-6 border-b border-[#222122] pb-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex items-center gap-2 text-sm text-[#A1A1A1]">
        <Link href={`/dashboard`} className="hover:text-[#69E300] transition-colors flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 border border-white/10">
            <AvatarImage src={`https://github.com/${owner}.png`} />
            <AvatarFallback>{owner[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold text-[#F8F7F8] tracking-tight">
                PR #{prNumber}
              </h1>
              {data.repo && (
                <Badge className="bg-[#171717] text-[#A1A1A1] border-[#222122] hover:bg-[#171717] font-mono">
                  {data.repo}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-[#71717A]">
              <span className="font-medium text-[#A1A1A1]">{repoName}</span>
              <span>•</span>
              <span>
                Owned by <span className="text-[#F8F7F8]">{owner}</span>
              </span>
              <span>•</span>
              <span>{data.timestamp ? formatDistanceToNow(new Date(data.timestamp), { addSuffix: true }) : 'Just now'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border mr-2 ${statusColor}`}>
            <div className={`h-2 w-2 rounded-full animate-pulse ${statusDot}`} />
            <span className="text-xs font-bold uppercase tracking-wider">{status}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-[#222122] bg-transparent text-[#F8F7F8] hover:bg-[#171717] hover:text-[#69E300]"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Re-run Audit
          </Button>
          <Button size="sm" className="bg-[#F8F7F8] text-black hover:bg-[#F8F7F8]/90 font-semibold" asChild>
            <a href={data.url || `https://github.com/${data.repo}`} target="_blank" rel="noopener noreferrer">
              <Github className="mr-2 h-4 w-4" />
              View on GitHub
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
