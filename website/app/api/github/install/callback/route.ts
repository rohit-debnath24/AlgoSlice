import { type NextRequest, NextResponse } from "next/server"
import { getSession, setGitHubTokenCookie } from "@/lib/jwt"

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const installationId = searchParams.get('installation_id')
    const setupAction = searchParams.get('setup_action')

    console.log('GitHub callback received:', {
        code: code ? 'present' : 'missing',
        state: state ? 'present' : 'missing',
        installationId,
        setupAction
    })

    // Verify user session
    const session = await getSession()

    if (!session) {
        console.log('No session found, redirecting to login')
        return NextResponse.redirect(new URL('/login?error=session_expired', request.url))
    }

    console.log('Session found:', { userId: session.userId, sessionId: session.sessionId })

    // Verify state matches session ID (CSRF protection) - only if state is provided
    if (state && state !== session.sessionId) {
        console.log('State mismatch:', { expected: session.sessionId, received: state })
        return NextResponse.redirect(new URL(`/dashboard/${session.userId}?error=invalid_state`, request.url))
    }

    // Handle GitHub App installation (both 'install' and 'update' actions)
    if (installationId) {
        console.log('Processing installation ID:', installationId)

        // Store installation ID in cookie for later use
        const response = NextResponse.redirect(new URL(`/dashboard/${session.userId}?github_installed=true`, request.url))
        response.cookies.set('github_installation_id', installationId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365, // 1 year
            path: '/'
        })

        console.log('Redirecting to dashboard with installation success')
        return response
    }

    // Handle OAuth code exchange
    if (code) {
        try {
            // Exchange code for access token
            const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    client_id: process.env.GITHUB_APP_CLIENT_ID,
                    client_secret: process.env.GITHUB_APP_CLIENT_SECRET,
                    code: code,
                }),
            })

            if (!tokenResponse.ok) {
                throw new Error('Failed to exchange code for token')
            }

            const tokenData = await tokenResponse.json()

            if (tokenData.error) {
                throw new Error(tokenData.error_description || tokenData.error)
            }

            // Set GitHub token cookie
            const response = NextResponse.redirect(new URL(`/dashboard/${session.userId}?github_connected=true`, request.url))
            setGitHubTokenCookie(tokenData.access_token, response)

            return response
        } catch (error) {
            console.error('Error exchanging GitHub code:', error)
            return NextResponse.redirect(new URL(`/dashboard/${session.userId}?error=github_auth_failed`, request.url))
        }
    }

    // If no code or installation_id, redirect back to dashboard
    console.log('No valid parameters found, redirecting to dashboard')
    console.log('All search params:', Object.fromEntries(searchParams.entries()))

    return NextResponse.redirect(new URL(`/dashboard/${session.userId}?error=missing_parameters`, request.url))
}
