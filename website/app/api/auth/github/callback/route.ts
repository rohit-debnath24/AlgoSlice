import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, setSessionCookie, setGitHubTokenCookie } from '@/lib/jwt'
import { findUserByGitHubId, createUser, findUserByEmail, updateUser } from '@/lib/db'

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface GitHubUser {
    id: number
    login: string
    email: string | null
    name: string | null
    avatar_url: string
}

interface GitHubEmail {
    email: string
    primary: boolean
    verified: boolean
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
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: GITHUB_CALLBACK_URL,
            }),
        })

        const tokenData = await tokenResponse.json()

        if (tokenData.error || !tokenData.access_token) {
            console.error('GitHub token error:', tokenData)
            return NextResponse.redirect(`${APP_URL}/login?error=oauth_failed`)
        }

        const accessToken = tokenData.access_token

        // Fetch user data from GitHub
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        })

        if (!userResponse.ok) {
            console.error('GitHub user fetch failed:', userResponse.status)
            return NextResponse.redirect(`${APP_URL}/login?error=oauth_failed`)
        }

        const githubUser: GitHubUser = await userResponse.json()

        // Fetch user emails if email is not public
        let email = githubUser.email

        if (!email) {
            const emailResponse = await fetch('https://api.github.com/user/emails', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
            })

            if (emailResponse.ok) {
                const emails: GitHubEmail[] = await emailResponse.json()
                const primaryEmail = emails.find(e => e.primary && e.verified)
                email = primaryEmail?.email || emails[0]?.email
            }
        }

        if (!email) {
            return NextResponse.redirect(`${APP_URL}/login?error=oauth_failed`)
        }

        // Check if user exists
        let user = await findUserByGitHubId(String(githubUser.id))

        if (!user) {
            // Check if email is already used by local account
            const existingUser = await findUserByEmail(email)

            if (existingUser && existingUser.provider === 'email') {
                return NextResponse.redirect(`${APP_URL}/login?error=local_account_exists`)
            }

            // Create new user
            user = await createUser({
                email,
                name: githubUser.name || githubUser.login,
                provider: 'github',
                githubId: String(githubUser.id),
                githubUsername: githubUser.login,
                avatar: githubUser.avatar_url,
            })
        } else {
            // Update user info
            await updateUser(user.userId, {
                name: githubUser.name || githubUser.login,
                githubUsername: githubUser.login,
                avatar: githubUser.avatar_url,
            })
        }

        // Create session token
        const sessionToken = createSessionToken({
            userId: user.userId,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            username: githubUser.login,
            provider: 'github',
        })

        // Set cookies
        await setSessionCookie(sessionToken)
        await setGitHubTokenCookie(accessToken)

        // Redirect to dashboard
        const response = NextResponse.redirect(`${APP_URL}/dashboard/${githubUser.login}`)

        // Clear oauth state cookie
        response.cookies.delete('oauth_state')

        return response
    } catch (error) {
        console.error('GitHub OAuth callback error:', error)
        return NextResponse.redirect(`${APP_URL}/login?error=oauth_failed`)
    }
}
