import { type NextRequest, NextResponse } from "next/server"
import { createSessionToken, setSessionCookie } from "@/lib/jwt"
import { createUser, findUserByEmail, hashPassword } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, password } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required for operator registration.",
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

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters long.",
        },
        { status: 400 },
      )
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Identity already registered. Please authenticate via login terminal.",
        },
        { status: 409 },
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create new user
    const user = await createUser({
      email,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      password: hashedPassword,
      provider: 'email',
    })

    console.log("[Ghostwriter] New operator registered:", {
      userId: user.userId,
      email: user.email,
      timestamp: new Date().toISOString(),
    })

    // Create session token
    const sessionToken = createSessionToken({
      userId: user.userId,
      email: user.email,
      name: user.name,
      provider: 'local',
    })

    // Set session cookie
    await setSessionCookie(sessionToken)

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Operator profile successfully initialized.",
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[Ghostwriter] Registration error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error during registration.",
      },
      { status: 500 },
    )
  }
}

