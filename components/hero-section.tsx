import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LiveTerminal } from "./live-terminal"
import { Shield, Zap, Search } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-20 pb-20">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-full max-w-7xl bg-[#69E300]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 max-w-[1400px]">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8 max-w-2xl">
            <div className="space-y-4">
              <Badge variant="outline" className="border-[#69E300]/20 bg-[#69E300]/5 text-[#69E300] py-1 px-3">
                <Zap className="mr-2 h-3.5 w-3.5" />
                Powered by Google ADK & W&B Weave
              </Badge>
              <h1 className="text-5xl font-display font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
                Algo 
                <span className="text-[#69E300]">Slice</span>
              </h1>
              <p className="text-lg text-white/60 leading-relaxed max-w-xl">
                Eliminate the manual review bottleneck. Our agentic platform autonomously audits code, generates
                documentation, and secures your repos with 100% observability.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-[#69E300] text-black hover:bg-[#5bc200] font-bold h-12 px-8">
                Connect Repository
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold h-12 px-8"
              >
                View Agent Docs
              </Button>
            </div>
          </div>

          <div className="relative">
            <LiveTerminal />
            {/* Ambient glow behind terminal */}
            <div className="absolute -inset-4 bg-[#69E300]/5 blur-2xl rounded-2xl pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  )
}
