import { Navigation } from "@/components/navigation"
import { AuditHeader } from "@/components/audit-header"
import { AuditVerdict } from "@/components/audit-verdict"
import { AuditConsole } from "@/components/audit-console"
import { SecurityFindings } from "@/components/security-findings"
import { AuditDetails } from "@/components/audit-details"
import { AuditObservability } from "@/components/audit-observability"

async function getAuditData(prId: string) {
  try {
    // Fetch from Node.js backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
    const res = await fetch(`${backendUrl}/api/audits`, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error('Failed to fetch audits')
    }
    const audits: any[] = await res.json()

    // If prId is 'wqdidu', return the most recent audit for demo purposes as requested
    if (prId === 'wqdidu') {
      return audits.length > 0 ? audits[0] : null
    }

    // Otherwise find by ID (which is owner/repo/number)
    // The ID in URL encoded owner%2Frepo%2Fnumber
    const decodedId = decodeURIComponent(prId)
    return audits.find((a: any) => a.id === decodedId || a.pr_id.toString() === prId) || null
  } catch (error) {
    console.error("Error fetching audit:", error)
    return null
  }
}

export default async function AuditCenterPage({ params }: { params: { prId: string } }) {
  const { prId } = await params
  const auditData = await getAuditData(prId)

  if (!auditData) {
    return (
      <main className="min-h-screen bg-[#0A0809] flex flex-col items-center justify-center text-white">
        <Navigation />
        <div className="flex flex-col items-center justify-center flex-1 px-4">
          <div className="h-3 w-3 rounded-full bg-[#69E300] animate-pulse mb-6" />
          <h1 className="text-4xl font-bold mb-4">Audit Not Found</h1>
          <p className="text-white/50 text-center max-w-md mb-6">
            Could not find audit logs for ID: {prId}
          </p>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 max-w-xl">
            <h2 className="text-lg font-semibold mb-3 text-[#69E300]">Possible Reasons:</h2>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <span className="text-[#69E300] mt-0.5">•</span>
                <span>The PR analysis is still in progress. Please wait a few moments and refresh the page.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#69E300] mt-0.5">•</span>
                <span>The backend services (Python Agent on port 8000 or Node.js Backend on port 3001) may not be running.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#69E300] mt-0.5">•</span>
                <span>The PR URL might be invalid or inaccessible.</span>
              </li>
            </ul>
            <div className="mt-6 pt-4 border-t border-white/10">
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 text-[#69E300] hover:underline text-sm font-medium"
              >
                ← Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0A0809] pb-20 selection:bg-[#69E300]/30 text-white font-sans">
      <Navigation />

      <section className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 pt-32 pb-20 max-w-[1400px] space-y-12">
        {/* Header Section */}
        <section>
          {/* @ts-ignore */}
          <AuditHeader prId={prId} data={auditData} />
        </section>

        {/* Verdict Banner */}
        <section>
          {/* @ts-ignore */}
          <AuditVerdict data={auditData} />
        </section>

        {/* Core Demo Section: Live Agent Execution */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#69E300] animate-pulse" />
            <h3 className="text-sm font-bold text-[#F8F7F8] uppercase tracking-[0.2em]">Analysis Context</h3>
          </div>
          {/* @ts-ignore */}
          <AuditConsole data={auditData} />
        </section>

        {/* Audit Sections */}
        <section className="grid grid-cols-1 gap-12">
          {/* @ts-ignore */}
          <SecurityFindings data={auditData} />
          {/* @ts-ignore */}
          <AuditDetails data={auditData} />
        </section>

        {/* Observability Section */}
        <section>
          {/* @ts-ignore */}
          <AuditObservability data={auditData} />
        </section>
      </section>


    </main>
  )
}
