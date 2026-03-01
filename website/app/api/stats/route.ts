import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const res = await fetch(`${backendUrl}/api/stats`, { cache: 'no-store' });

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch stats' }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
