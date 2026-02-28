import { GitBranch, AlertCircle, CheckCircle2, Github } from "lucide-react"

interface GitHubRepo {
  id: number
  name: string
  description: string
  language: string
  topics: string[]
  url: string
  stars: number
  forks: number
  owner?: string
  fullName?: string
}

interface RepositoryGridProps {
  repos?: GitHubRepo[]
  isLoading?: boolean
}

const MOCK_REPOS = [
  { id: 1, name: "ghostwriter-core", health: 98, status: "Clean", branch: "main", issues: 0, language: "TypeScript" },
  { id: 2, name: "adk-orchestrator", health: 92, status: "Review Required", branch: "develop", issues: 3, language: "Python" },
  { id: 3, name: "weave-exporter", health: 100, status: "Protected", branch: "v2.0", issues: 0, language: "Go" },
  { id: 4, name: "sandbox-runtime", health: 85, status: "Audit Active", branch: "feature/isolation", issues: 12, language: "Rust" },
]

// Calculate health score based on repo metrics
function calculateHealth(repo: GitHubRepo): number {
  // Simple algorithm - can be enhanced with actual metrics
  const baseHealth = 70
  const starsBonus = Math.min(repo.stars / 100, 20)
  const languageBonus = repo.language ? 10 : 0
  return Math.min(100, Math.floor(baseHealth + starsBonus + languageBonus))
}

export function RepositoryGrid({ repos, isLoading }: RepositoryGridProps) {
  // Use provided repos or mock data. If repos is undefined, use MOCK_REPOS.
  // If repos is [], show empty state.
  const displayRepos = repos === undefined ? MOCK_REPOS : repos

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-xl border border-white/5 bg-[#171717] p-4 animate-pulse"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-white/10 rounded w-3/4"></div>
                <div className="h-3 bg-white/5 rounded w-1/2"></div>
              </div>
              <div className="h-10 w-10 rounded-full bg-white/5"></div>
            </div>
            <div className="mt-4 border-t border-white/5 pt-3">
              <div className="h-3 bg-white/5 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (displayRepos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-white/10 bg-white/5">
        <Github className="h-12 w-12 text-white/20 mb-4" />
        <p className="text-white/50 font-medium">No repositories found</p>
        <p className="text-white/30 text-xs mt-1">Connect your GitHub account to see your repositories</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {displayRepos.map((repo: any) => {
        const health = 'health' in repo ? repo.health : calculateHealth(repo)
        const status = 'status' in repo ? repo.status : (health >= 95 ? "Clean" : health >= 85 ? "Review Required" : "Audit Active")
        const branch = 'branch' in repo ? repo.branch : "main"
        const issues = 'issues' in repo ? repo.issues : Math.floor((100 - health) / 5)

        return (
          <a
            key={repo.id}
            href={`/repo/${repo.id}`}
            className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#171717] p-4 transition-all hover:border-[#69E300]/30 hover:shadow-[0_0_20px_rgba(105,227,0,0.1)] cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1 min-w-0">
                <h3 className="font-display font-semibold text-white group-hover:text-[#69E300] transition-colors truncate">
                  {repo.name}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-white/40">
                  {repo.owner ? (
                    <>
                      <Github className="h-3 w-3" />
                      <span className="truncate">{repo.owner}</span>
                    </>
                  ) : (
                    <>
                      <GitBranch className="h-3 w-3" />
                      {branch}
                    </>
                  )}
                </div>
                {repo.language && (
                  <div className="text-[10px] text-white/30 uppercase tracking-wider">
                    {repo.language}
                  </div>
                )}
              </div>
              <div className="relative flex h-10 w-10 items-center justify-center flex-shrink-0">
                <svg className="h-full w-full rotate-[-90deg]">
                  <circle
                    cx="20"
                    cy="20"
                    r="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-white/5"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={2 * Math.PI * 18}
                    strokeDashoffset={2 * Math.PI * 18 * (1 - health / 100)}
                    className="text-[#69E300]"
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-white">{health}%</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
              <div className="flex items-center gap-1.5">
                {issues > 0 ? (
                  <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#69E300]" />
                )}
                <span className="text-[11px] font-medium text-white/60">{status}</span>
              </div>
              <span className="text-[10px] text-white/30 uppercase tracking-tighter">{issues} Findings</span>
            </div>

            {repo.stars !== undefined && (
              <div className="mt-2 flex gap-3 text-[10px] text-white/30">
                <span>★ {repo.stars}</span>
                <span>⑂ {repo.forks}</span>
              </div>
            )}
          </a>
        )
      })}
    </div>
  )
}
