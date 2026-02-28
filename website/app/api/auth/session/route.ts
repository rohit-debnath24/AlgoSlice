import { NextResponse } from "next/server"
import { getSession } from '@/lib/jwt'

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          userId: session.userId,
          email: session.email,
          name: session.name,
          avatar: session.avatar,
          username: session.username,
          provider: session.provider,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Ghostwriter] Session check error:', error)
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
      },
      { status: 401 }
    )
  }
}

