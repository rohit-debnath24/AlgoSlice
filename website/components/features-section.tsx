import { Shield, Zap, Terminal, Database, Lock, Search, Sparkles } from "lucide-react"

const features = [
  {
    title: "Algorand Escrow",
    description:
      "Every rental is secured by a smart contract. Funds are only released to providers based on actual compute time verified on-chain.",
    icon: Lock,
    accent: "bg-[#69E300]/10 text-[#69E300]",
  },
  {
    title: "Docker Sandboxing",
    description:
      "Provider machines are protected by industry-standard sandboxing. Every workload runs in an isolated, resource-capped container.",
    icon: Shield,
    accent: "bg-[#69E300]/10 text-[#69E300]",
  },
  {
    title: "Live Terminal",
    description:
      "Stream execution logs in real-time from the remote GPU node directly to your local CLI via our low-latency WebSocket proxy.",
    icon: Terminal,
    accent: "bg-[#69E300]/10 text-[#69E300]",
  },
  {
    title: "P2P Marketplace",
    description:
      "Browse available hardware from around the world. Filter by GPU model, VRAM, and location to find the perfect node for your task.",
    icon: Search,
    accent: "bg-[#69E300]/10 text-[#69E300]",
  },
  {
    title: "CLI-First Workflow",
    description:
      "Built for developers. Rent, run, and monitor GPU jobs with simple commands that fit perfectly into your existing dev cycles.",
    icon: Zap,
    accent: "bg-[#69E300]/10 text-[#69E300]",
  },
  {
    title: "AI Orchestration",
    description:
      "Our coordinator intelligently matches your workload requirements with the most efficient hardware available on the network.",
    icon: Sparkles,
    accent: "bg-[#69E300]/10 text-[#69E300]",
  },
]

export function FeaturesSection() {
  return (
    <div id="features" className="space-y-12 py-24">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#69E300]/20 bg-[#69E300]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#69E300]">
          <Sparkles className="h-4 w-4" />
          Core Features
        </div>
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Built for <span className="text-[#69E300]">Global Scale</span></h2>
        <p className="text-white/40 text-lg">
          The most secure decentralized compute platform for high-growth AI development teams.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="group relative rounded-2xl border border-white/5 bg-[#171717] p-6 transition-all hover:shadow-[0_0_40px_rgba(105,227,0,0.5)] hover:bg-[#1a1a1a]"
          >
            <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.accent}`}>
              <feature.icon className="h-6 w-6" />
            </div>
            <h3 className="mb-3 text-xl font-bold text-white">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-white/40">{feature.description}</p>
          </div>
        ))}
      </div>
    </div >
  )
}
