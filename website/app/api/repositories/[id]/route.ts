import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/jwt"
import { getRepository } from "@/lib/repository"

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getSession()

    if (!session) {
        return NextResponse.json({
            error: 'Not authenticated. Please log in first.'
        }, { status: 401 })
    }

    try {
        const repoId = parseInt(params.id)

        if (isNaN(repoId)) {
            return NextResponse.json({
                error: 'Invalid repository ID'
            }, { status: 400 })
        }

        // Fetch repository from database
        const repository = await getRepository(session.userId, repoId)

        if (!repository) {
            return NextResponse.json({
                error: 'Repository not found'
            }, { status: 404 })
        }

        // Transform to match frontend interface
        const transformedRepo = {
            id: repository.repoId,
            name: repository.name,
            description: repository.description,
            language: repository.language,
            topics: repository.topics || [],
            url: repository.url,
            stars: repository.stars,
            forks: repository.forks,
            owner: repository.owner,
            fullName: repository.fullName,
            health: repository.healthScore,
            status: repository.status,
            branch: repository.defaultBranch,
            issues: repository.findings,
            isPrivate: repository.isPrivate,
            lastAnalyzed: repository.lastAnalyzed
        }

        return NextResponse.json(transformedRepo)
    } catch (error: any) {
        console.error('Error fetching repository:', error)
        return NextResponse.json({
            error: error.message || 'Failed to fetch repository'
        }, { status: 500 })
    }
}
