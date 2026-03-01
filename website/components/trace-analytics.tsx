import { BarChart3, Clock, Zap, Wallet, Database } from "lucide-react"

export function TraceAnalytics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <AnalyticsCard title="Total Duration" value="18.4s" subtitle="1.2s avg per span" icon={Clock} progress={65} />
      <AnalyticsCard
        title="Token Usage"
        value="42,812"
        subtitle="84% prompt / 16% comp"
        icon={Database}
        progress={42}
      />
      <AnalyticsCard title="Tool Execution" value="27 calls" subtitle="98.2% success rate" icon={Zap} progress={98} />
      <AnalyticsCard title="Computed Cost" value="$0.124" subtitle="Optimized by 12%" icon={Wallet} progress={30} />
    </div>
  )
}

function AnalyticsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  progress,
}: {
  title: string
  value: string
  subtitle: string
  icon: any
  progress: number
}) {
  return (
    <div className="p-6 rounded-xl border border-[#222122] bg-[#171717] space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-8 rounded-lg bg-[#202023] flex items-center justify-center border border-[#222122]">
          <Icon className="h-4 w-4 text-[#71717A]" />
        </div>
        <BarChart3 className="h-4 w-4 text-[#71717A]/30" />
      </div>
      <div>
        <p className="text-[10px] text-[#71717A] uppercase font-bold tracking-[0.1em]">{title}</p>
        <h3 className="text-xl font-mono font-bold text-[#F8F7F8] mt-1">{value}</h3>
        <p className="text-[11px] text-[#A1A1A1] mt-1">{subtitle}</p>
      </div>
      <div className="h-1 w-full bg-[#202023] rounded-full overflow-hidden">
        <div className="h-full bg-[#69E300] transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}
