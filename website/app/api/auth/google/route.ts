import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL

export async function GET(request: NextRequest) {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CALLBACK_URL) {
        return NextResponse.json(
            { error: 'Google OAuth not configured' },
            { status: 500 }
        )
    }

    // Generate a random state for CSRF protection
    const state = crypto.randomUUID()

    // Google OAuth scopes
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
    ]

    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: GOOGLE_CALLBACK_URL,
        response_type: 'code',
        scope: scopes.join(' '),
        state: state,
        access_type: 'offline',
        prompt: 'consent',
    })

    const response = NextResponse.redirect(
        `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
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
