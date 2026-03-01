import { type NextRequest, NextResponse } from "next/server"
import { createSessionToken, setSessionCookie } from "@/lib/jwt"
import { findUserByEmail, verifyPassword } from "@/lib/db"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, password } = body

        // Validate required fields
        if (!email || !password) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email and password are required for authentication.",
                },
                { status: 400 },
            )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid email format provided.",
                },
                { status: 400 },
            )
        }

        // Find user by email
        const user = await findUserByEmail(email)

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "No operator profile found. Please register to initialize access.",
                },
                { status: 401 },
            )
        }

        // Check if user registered with OAuth
        if (user.provider !== 'email' || !user.password) {
            return NextResponse.json(
                {
                    success: false,
                    message: `This account uses ${user.provider} authentication. Please sign in with ${user.provider}.`,
                },
                { status: 401 },
            )
        }

        // Verify password
        const isPasswordValid = await verifyPassword(password, user.password)

        if (!isPasswordValid) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid credentials. Access denied.",
                },
                { status: 401 },
            )
        }

        console.log("[Ghostwriter] Operator authenticated:", {
            userId: user.userId,
            email: user.email,
            timestamp: new Date().toISOString(),
        })

        // Create session token
        const sessionToken = createSessionToken({
            userId: user.userId,
            email: user.email,
            name: user.name,
            username: user.email.split('@')[0],
            provider: 'local',
        })

        // Set session cookie
        await setSessionCookie(sessionToken)

        // Return success response
        return NextResponse.json(
            {
                success: true,
                message: "Authentication successful. Access granted.",
                user: {
                    userId: user.userId,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    name: user.name,
                },
            },
            { status: 200 },
        )
    } catch (error) {
        console.error("[Ghostwriter] Login error:", error)
        return NextResponse.json(
            {
                success: false,
                message: "Internal server error during authentication.",
            },
            { status: 500 },
        )
    }
}
