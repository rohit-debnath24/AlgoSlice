import { NextRequest, NextResponse } from 'next/server'

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL

export async function GET(request: NextRequest) {
    if (!GITHUB_CLIENT_ID || !GITHUB_CALLBACK_URL) {
        return NextResponse.json(
            { error: 'GitHub OAuth not configured' },
            { status: 500 }
        )
    }

    // Generate a random state for CSRF protection
    const state = crypto.randomUUID()

    // Store state in cookie for verification in callback
    const response = NextResponse.redirect(
        `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}&scope=user:email,read:user,repo&state=${state}`
    )

    response.cookies.set('oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
    })

    return response
}
