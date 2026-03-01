import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { prUrl, email } = body

        if (!prUrl) {
            return NextResponse.json({ error: 'PR URL is required' }, { status: 400 })
        }

        // 1. Parse URL to get owner, repo, number
        const match = prUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/)
        if (!match) {
            return NextResponse.json({ error: 'Invalid GitHub PR URL format' }, { status: 400 })
        }

        const [, owner, repo, number] = match
        const prNumber = parseInt(number)

        // 2. Fetch PR Metadata from GitHub
        // We use the public GitHub API (rate limited if no token, but sufficient for low volume)
        // Or usage process.env.GITHUB_TOKEN if you have it in Vercel env
        const ghHeaders: HeadersInit = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "DevOps-Ghostwriter-App"
        }

        // If you added GITHUB_TOKEN to Next.js env, use it validly
        if (process.env.GITHUB_TOKEN) {
            ghHeaders["Authorization"] = `token ${process.env.GITHUB_TOKEN}`
        }

        const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`, {
            headers: ghHeaders
        })

        if (!ghRes.ok) {
            return NextResponse.json({
                error: `Failed to fetch PR from GitHub (${ghRes.status})`
            }, { status: ghRes.status })
        }

        const prData = await ghRes.json()

        // 3. Construct Payload for Backend
        const payload = {
            action: "opened",
            pull_request: {
                number: prNumber,
                title: prData.title || `PR #${prNumber}`,
                body: prData.body || "No description provided",
                html_url: prData.html_url || prUrl,
                diff_url: prData.diff_url || ""
            },
            repository: {
                name: repo,
                owner: { login: owner },
                full_name: `${owner}/${repo}`
            },
            email: email || null, // Use provided email or let backend rely on payload defaults
            github_token: request.cookies.get('github_token')?.value || null
        }

        // 4. Forward to Node.js Backend
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        const targetUrl = `${backendUrl}/api/webhook/github`

        console.log(`[API] Forwarding to Backend: ${targetUrl}`)

        const backendRes = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-GitHub-Event': 'pull_request'
            },
            body: JSON.stringify(payload)
        })

        if (!backendRes.ok) {
            const txt = await backendRes.text()
            return NextResponse.json({
                error: 'Backend rejected the analysis request',
                details: txt
            }, { status: backendRes.status })
        }

        const backendData = await backendRes.json()

        return NextResponse.json({
            success: true,
            message: 'PR analysis triggered successfully',
            backend_response: backendData
        })

    } catch (error: any) {
        console.error('Error submitting PR:', error)
        return NextResponse.json({
            error: error.message || 'Failed to submit PR for analysis'
        }, { status: 500 })
    }
}
