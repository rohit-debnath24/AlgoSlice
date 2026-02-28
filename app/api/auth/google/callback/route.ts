import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, setSessionCookie, setGoogleTokenCookie } from '@/lib/jwt'
import { findUserByGoogleId, createUser, findUserByEmail, updateUser } from '@/lib/db'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface GoogleUser {
    id: string
    email: string
    verified_email: boolean
    name: string
    given_name: string
    family_name: string
    picture: string
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Check for OAuth errors
    if (error) {
        return NextResponse.redirect(`${APP_URL}/login?error=oauth_failed`)
    }

    if (!code || !state) {
        return NextResponse.redirect(`${APP_URL}/login?error=oauth_failed`)
    }

    // Verify state for CSRF protection
    const storedState = request.cookies.get('oauth_state')?.value
    if (!storedState || storedState !== state) {
        return NextResponse.redirect(`${APP_URL}/login?error=oauth_failed`)
    }

    try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID!,
                client_secret: GOOGLE_CLIENT_SECRET!,
                redirect_uri: GOOGLE_CALLBACK_URL!,
                grant_type: 'authorization_code',
            }),
        })

        const tokenData = await tokenResponse.json()

        if (tokenData.error || !tokenData.access_token) {
            console.error('Google token error:', tokenData)
            return NextResponse.redirect(`${APP_URL}/login?error=oauth_failed`)
        }

        const accessToken = tokenData.access_token

        // Fetch user data from Google
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        })

        if (!userResponse.ok) {
            console.error('Google user fetch failed:', userResponse.status)
            return NextResponse.redirect(`${APP_URL}/login?error=oauth_failed`)
        }

        const googleUser: GoogleUser = await userResponse.json()

        if (!googleUser.verified_email) {
            return NextResponse.redirect(`${APP_URL}/login?error=oauth_failed`)
        }

        // Check if user exists
        let user = await findUserByGoogleId(googleUser.id)

        if (!user) {
            // Check if email is already used by local account
            const existingUser = await findUserByEmail(googleUser.email)

            if (existingUser && existingUser.provider === 'email') {
                return NextResponse.redirect(`${APP_URL}/login?error=local_account_exists`)
            }

            // Create new user
            user = await createUser({
                email: googleUser.email,
                name: googleUser.name,
                firstName: googleUser.given_name,
                lastName: googleUser.family_name,
                provider: 'google',
                googleId: googleUser.id,
                avatar: googleUser.picture,
            })
        } else {
            // Update user info
            await updateUser(user.userId, {
                name: googleUser.name,
                avatar: googleUser.picture,
            })
        }

        // Create session token
        const sessionToken = createSessionToken({
            userId: user.userId,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            username: user.email.split('@')[0],
            provider: 'google',
        })

        // Set cookies
        await setSessionCookie(sessionToken)
        await setGoogleTokenCookie(accessToken)

        // Redirect to dashboard
        const response = NextResponse.redirect(`${APP_URL}/dashboard/${user.email.split('@')[0]}`)

        // Clear oauth state cookie
        response.cookies.delete('oauth_state')

        return response
    } catch (error) {
        console.error('Google OAuth callback error:', error)
        return NextResponse.redirect(`${APP_URL}/login?error=oauth_failed`)
    }
}
