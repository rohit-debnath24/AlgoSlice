import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/jwt"

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

        // Fetch audits from the Node.js backend server
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
        const response = await fetch(`${backendUrl}/api/audits`)

        if (!response.ok) {
            throw new Error('Failed to fetch audits from backend')
        }

        const allAudits = await response.json()

        // Filter audits for this specific repository
        // We need to match by repository fullName or owner/name combination
        // Since we only have repoId, we need to get the repo first
        const repoResponse = await fetch(`${request.nextUrl.origin}/api/repositories/${repoId}`, {
            headers: {
                cookie: request.headers.get('cookie') || ''
            }
        })

        if (!repoResponse.ok) {
            // If we can't get repo details, return all audits
            return NextResponse.json(allAudits)
        }

        const repo = await repoResponse.json()

        // Filter audits that match this repository
        const filteredAudits = allAudits.filter((audit: any) => {
            // Check if audit.repo matches repo.fullName
            return audit.repo === repo.fullName || audit.repo === `${repo.owner}/${repo.name}`
        })

        return NextResponse.json(filteredAudits)
    } catch (error: any) {
        console.error('Error fetching audits:', error)
        return NextResponse.json({
            error: error.message || 'Failed to fetch audits'
        }, { status: 500 })
    }
}
