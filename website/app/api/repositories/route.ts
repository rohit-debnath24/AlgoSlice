import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/jwt"
import { getUserRepositories } from "@/lib/repository"

export async function GET(request: NextRequest) {
    const session = await getSession()

    if (!session) {
        return NextResponse.json({
            error: 'Not authenticated. Please log in first.'
        }, { status: 401 })
    }

    try {
        // Fetch repositories from database
        const repositories = await getUserRepositories(session.userId)

        // Transform to match frontend interface
        const transformedRepos = repositories.map((repo: any) => ({
            id: repo.repoId,
            name: repo.name,
            description: repo.description,
            language: repo.language,
            topics: repo.topics || [],
            url: repo.url,
            stars: repo.stars,
            forks: repo.forks,
            owner: repo.owner,
            fullName: repo.fullName,
            health: repo.healthScore,
            status: repo.status,
            branch: repo.defaultBranch,
            issues: repo.findings
        }))

        return NextResponse.json(transformedRepos)
    } catch (error: any) {
        console.error('Error fetching user repositories:', error)
        return NextResponse.json({
            error: error.message || 'Failed to fetch repositories'
        }, { status: 500 })
    }
}
