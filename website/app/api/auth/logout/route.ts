import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/jwt'

export async function POST() {
    try {
        await clearSessionCookie()

        return NextResponse.json(
            {
                success: true,
                message: 'Session terminated successfully.',
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('[Ghostwriter] Logout error:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Error during session termination.',
            },
            { status: 500 }
        )
    }
}

export async function GET() {
    return POST()
}
