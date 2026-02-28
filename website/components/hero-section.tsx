import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
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
              <h1 className="text-5xl font-display font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
                GPU
                <span className="text-[#69E300]"> Power</span>
              </h1>
              <p className="text-lg text-white/60 leading-relaxed max-w-xl">
                The decentralized marketplace for compute. Rent high-performance GPUs with
                Algorand-secured escrow and automated Docker sandboxing.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-[#69E300] text-black hover:bg-[#5bc200] font-bold h-12 px-8" asChild>
                <Link href="/marketplace">Explore Marketplace</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold h-12 px-8"
                asChild
              >
                <Link href="https://testnet.algoexplorer.io/application/756316410" target="_blank">View Smart Contract</Link>
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
