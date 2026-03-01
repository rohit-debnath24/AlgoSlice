import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/jwt"

export async function GET(request: NextRequest) {
    // Verify user is authenticated
    const session = await getSession()

    if (!session) {
        return NextResponse.json({
            error: 'Not authenticated. Please log in first.'
        }, { status: 401 })
    }

    // Store the user's session ID in a state parameter to verify the callback
    const state = session.sessionId

    // GitHub App Installation URL
    const githubAppName = process.env.GITHUB_APP_NAME

    if (!githubAppName) {
        console.error('GITHUB_APP_NAME is not configured')
        return NextResponse.json({
            error: 'GitHub App is not configured. Please contact support.'
        }, { status: 500 })
    }

    // Build the callback URL
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin
    const callbackUrl = `${baseUrl}/api/github/install/callback`

    // Redirect to GitHub App installation page with repository selection
    // Include state and redirect_uri for proper callback handling
    const installUrl = `https://github.com/apps/${githubAppName}/installations/new?state=${state}`

    return NextResponse.redirect(installUrl)
}
