import { Terminal, Shield, Zap, Code2, CheckCircle2, Workflow } from "lucide-react"

const steps = [
  {
    icon: <Code2 className="h-6 w-6" />,
    title: "Connect Repositories",
    description: "Link your GitHub or GitLab repositories. Ghostwriter maps your entire codebase and dependency tree.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Isolated Sandbox",
    description:
      "Agents spin up ephemeral, isolated environments for every task, ensuring zero risk to your production code.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Ghostwriter Analysis",
    description:
      "Agents analyze PRs, find vulnerabilities, or execute refactors with deep architectural understanding.",
  },
  {
    icon: <CheckCircle2 className="h-6 w-6" />,
    title: "Verified Output",
    description: "Get verified code suggestions with full audit logs and performance metrics before merging.",
  },
]

export function HowItWorks() {
  return (
    <section className="space-y-12 py-24">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#69E300]/20 bg-[#69E300]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#69E300]">
          <Workflow className="h-4 w-4" />
          Workflow
        </div>
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">How <span className="text-[#69E300]">it Works</span></h2>
        <p className="text-white/40 text-lg">
          A streamlined workflow that connects your repositories to autonomous agents, ensuring secure and verified code operations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((step, index) => (
          <div
            key={index}
            className="relative group p-8 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/[0.08] hover:shadow-[0_0_40px_rgba(105,227,0,0.5)] transition-all"
          >
            <div className="absolute -top-4 -left-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a0809] border border-white/10 text-white/20 text-xs font-bold font-mono">
              0{index + 1}
            </div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#69E300]/10 text-[#69E300] border border-[#69E300]/20">
              {step.icon}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
            <p className="text-sm text-white/40 leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
