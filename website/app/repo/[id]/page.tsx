import { Navigation } from "@/components/navigation"
import { RepoHeader } from "@/components/repo-header"
import { RepoHealthOverview } from "@/components/repo-health-overview"
import { PRAuditTimeline } from "@/components/pr-audit-timeline"
import { PRList } from "@/components/pr-list"
import { SecurityTrends } from "@/components/security-trends"
import { AgentActivitySummary } from "@/components/agent-activity-summary"
import { RepoContributors } from "@/components/repo-contributors"
import { getSession } from "@/lib/jwt"
import { getRepository } from "@/lib/repository"
import { redirect } from "next/navigation"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

async function fetchAuditsFromBackend(repoFullName: string) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/api/audits`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      return []
    }

    const allAudits = await response.json()

    // Filter audits for this repository
    return allAudits.filter((audit: any) => audit.repo === repoFullName)
  } catch (error) {
    console.error('Error fetching audits:', error)
    return []
  }
}





export default async function RepoDetailsPage({ params }: { params: { id: string } }) {
  const { id } = await params

  // Check authentication
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  // Parse the repository ID
  const repoId = parseInt(id)

  if (isNaN(repoId)) {
    return (
      <main className="min-h-screen bg-[#0A0809] pb-20">
        <Navigation />
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 pt-32">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Invalid Repository ID</h1>
            <p className="text-white/60">Please provide a valid repository ID.</p>
          </div>
        </div>
      </main>
    )
  }

  // Fetch repository from database
  const repository = await getRepository(session.userId, repoId)

  if (!repository) {
    return (
      <main className="min-h-screen bg-[#0A0809] pb-20">
        <Navigation />
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 pt-32">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Repository Not Found</h1>
            <p className="text-white/60">The repository you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </div>
      </main>
    )
  }

  // Fetch audits
  const audits = await fetchAuditsFromBackend(repository.fullName)

  // Create owner profile from database
  await connectDB()
  const user = await User.findOne({ userId: session.userId })

  const ownerProfile = user ? {
    id: Math.floor(Math.random() * 1000000),
    name: user.githubUsername || repository.owner,
    avatar: user.avatar || `https://github.com/${repository.owner}.png`,
    commits: repository.stars * 2 || 10,
    prs: Math.floor((repository.stars * 2 || 10) * 0.4),
    role: 'Repository Owner',
    profileUrl: `https://github.com/${repository.owner}`
  } : null

  // No contributors from GitHub API since we don't have token
  const contributors: any[] = []

  return (
    <main className="min-h-screen bg-[#0A0809] pb-20">
      <Navigation />

      <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 pt-32 space-y-12 max-w-[1400px]">
        {/* Header Section */}
        <section className="animate-in fade-in slide-in-from-top-4 duration-700">
          <RepoHeader
            repository={{
              id: repository.repoId,
              name: repository.name,
              description: repository.description || '',
              owner: repository.owner,
              fullName: repository.fullName,
              url: repository.url,
              branch: repository.defaultBranch,
              lastAnalyzed: repository.lastAnalyzed,
              stars: repository.stars,
              forks: repository.forks
            }}
            totalPRs={audits.length}
            username={session.username || session.email?.split('@')[0]}
          />
        </section>

        {/* Health Overview Grid */}
        <section className="animate-in fade-in slide-in-from-top-4 duration-700 delay-100">
          <RepoHealthOverview
            repository={{
              health: repository.healthScore,
              status: repository.status
            }}
            audits={audits}
          />
        </section>

        {/* Main Content: Timeline & Sidebars */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Timeline & Trends */}
          <div className="space-y-12 lg:col-span-8">
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <PRAuditTimeline audits={audits} />
            </section>
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <PRList owner={repository.owner} repo={repository.name} />
            </section>
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
              <SecurityTrends audits={audits} />
            </section>
          </div>


          {/* Activity & Observability */}
          <aside className="space-y-12 lg:col-span-4">
            <section className="animate-in fade-in slide-in-from-right-4 duration-700 delay-400">
              <AgentActivitySummary audits={audits} />
            </section>
            <section className="animate-in fade-in slide-in-from-right-4 duration-700 delay-500">
              <RepoContributors contributors={contributors} owner={ownerProfile} />
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
