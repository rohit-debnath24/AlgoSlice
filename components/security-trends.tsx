"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface SecurityTrendsProps {
  audits: any[]
}

export function SecurityTrends({ audits }: SecurityTrendsProps) {
  // Sort audits by timestamp ascending
  const sortedAudits = [...audits].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  // Take last 10 audits for legible trend
  const recentAudits = sortedAudits.slice(-10)

  // Transform data for chart
  const data = recentAudits.map(audit => {
    let vulnCount = 0
    if (audit.result?.status === 'error' || audit.result?.status === 'failed') {
      vulnCount = 1 // Default to 1 if just status fail
    }
    // Try to parse detailed vuln count if available
    const securityData = audit.security_snapshot || audit.result?.security_analysis
    if (securityData) {
      try {
        const secObj = typeof securityData === 'string' ? JSON.parse(securityData) : securityData
        if (secObj.vulnerabilities && Array.isArray(secObj.vulnerabilities)) {
          vulnCount = secObj.vulnerabilities.length
        } else if (secObj.vulnerabilities) {
          // Maybe it's a number or something else
          vulnCount = 1
        }
      } catch (e) { /* ignore */ }
    }

    return {
      name: `PR #${audit.pr_id}`,
      quality: Math.round((audit.result?.confidence_score || 0.5) * 100),
      vulnerabilities: vulnCount,
      timestamp: new Date(audit.timestamp).toLocaleTimeString()
    }
  })

  // Calculate summary stats based on ALL audits (not just chart)
  const totalAudits = audits.length
  const avgQuality = totalAudits > 0
    ? Math.round(audits.reduce((acc, a) => acc + ((a.result?.confidence_score || 0.5) * 100), 0) / totalAudits)
    : 0

  const totalVulns = audits.reduce((acc, audit) => {
    // reuse logic roughly or simplify
    if (audit.result?.status === 'error' || audit.result?.status === 'failed') return acc + 1
    return acc
  }, 0)

  // Calculate runtime errors (estimate from failed audits)
  const runtimeErrors = audits.filter(a =>
    a.result?.comment?.toLowerCase().includes('runtime') ||
    a.result?.comment?.toLowerCase().includes('error')
  ).length

  // Calculate docs generated (estimate from audits mentioning documentation)
  const docsGenerated = audits.filter(a =>
    a.result?.comment?.toLowerCase().includes('doc') ||
    a.result?.comment?.toLowerCase().includes('documentation')
  ).length

  if (audits.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight text-white">Security & Quality Trends</h2>
        <div className="rounded-xl border border-white/5 bg-[#171717] p-6 flex items-center justify-center h-[200px]">
          <p className="text-white/40 text-sm">No trend data available yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-white">Security & Quality Trends</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[#69E300]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Confidence Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Issues Found</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-[#171717] p-6">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#69E300" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#69E300" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorVuln" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#52525b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#52525b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#171717",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#fff"
                }}
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="quality"
                stroke="#69E300"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorQuality)"
                name="Confidence"
              />
              <Area
                type="monotone"
                dataKey="vulnerabilities"
                stroke="#f87171"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorVuln)"
                name="Issues"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/5 pt-6 text-center">
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">Avg Confidence</div>
            <div className="text-xl font-black text-white">
              {avgQuality}%
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">Total Issues</div>
            <div className="text-xl font-black text-white">{totalVulns}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">Docs Gen</div>
            <div className="text-xl font-black text-white">{docsGenerated}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
