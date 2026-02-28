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

        // Get repository details first
        const repoResponse = await fetch(`${request.nextUrl.origin}/api/repositories/${repoId}`, {
            headers: {
                cookie: request.headers.get('cookie') || ''
            }
        })

        if (!repoResponse.ok) {
            return NextResponse.json({
                error: 'Repository not found'
            }, { status: 404 })
        }

        const repo = await repoResponse.json()

        // Since we don't have GitHub token, return empty array
        // Contributors will be shown from the owner profile in the frontend
        return NextResponse.json([])
    } catch (error: any) {
        console.error('Error fetching contributors:', error)
        return NextResponse.json({
            error: error.message || 'Failed to fetch contributors'
        }, { status: 500 })
    }
}
