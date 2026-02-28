"use client"

import { useState } from "react"
import { Network, Shield, Cpu, FileText, Eye, ArrowRight, Activity, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Agent {
    id: string
    name: string
    role: string
    description: string
    capabilities: string[]
    icon: React.ReactNode
    status: "idle" | "running" | "completed"
}

const agents: Agent[] = [
    {
        id: "orchestrator",
        name: "Orchestrator Agent",
        role: "Manager & Planner",
        description: "Coordinates the entire audit process, analyzes PR diffs, manages shared state, and dispatches specialized agents in parallel.",
        capabilities: [
            "PR diff understanding",
            "Task decomposition",
            "Agent coordination",
            "Final result synthesis"
        ],
        icon: <Network className="w-6 h-6" />,
        status: "running"
    },
    {
        id: "security",
        name: "Security Auditor Agent",
        role: "Security Specialist",
        description: "Scans code changes for vulnerabilities, secrets, insecure patterns, and dependency risks using deep reasoning.",
        capabilities: [
            "Secret detection",
            "Injection risk analysis",
            "Dependency inspection",
            "Severity classification"
        ],
        icon: <Shield className="w-6 h-6" />,
        status: "running"
    },
    {
        id: "runtime",
        name: "Runtime Validator Agent",
        role: "Execution & Logic Validator",
        description: "Generates and executes lightweight test scripts in a secure sandbox to validate runtime behavior.",
        capabilities: [
            "Test generation",
            "Sandbox execution",
            "Crash detection",
            "Runtime logs"
        ],
        icon: <Cpu className="w-6 h-6" />,
        status: "running"
    },
    {
        id: "ghostwriter",
        name: "Ghostwriter Agent",
        role: "Documentation & Reporting",
        description: "Synthesizes findings into professional GitHub comments and updates documentation automatically.",
        capabilities: [
            "PR comment generation",
            "README updates",
            "Markdown formatting",
            "Summary synthesis"
        ],
        icon: <FileText className="w-6 h-6" />,
        status: "running"
    }
]

export function AgentsSection() {
    const [hoveredAgent, setHoveredAgent] = useState<string | null>(null)

    return (
        <section id="agents" className="space-y-12 py-24">
            {/* Section Header */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#69E300]/20 bg-[#69E300]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#69E300]">
                    <Bot className="h-4 w-4" />
                    Agent System
                </div>
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                    Autonomous <span className="text-[#69E300]">AI Agents</span>
                </h2>
                <p className="text-white/40 text-lg">
                    Specialized agents collaborate to review pull requests, validate runtime behavior,
                    audit security, and generate documentation — fully automated and observable.
                </p>
            </div>

            {/* Agent Cards Grid with Workflow Connections */}
            <div className="relative mb-12">
                {/* SVG Curved Connections */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block" style={{ zIndex: 0 }}>
                    {/* Orchestrator to Security */}
                    <path
                        d="M 25% 50% Q 37.5% 30%, 50% 50%"
                        stroke="rgba(105, 227, 0, 0.2)"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="5,5"
                    />
                    {/* Security to Runtime */}
                    <path
                        d="M 50% 50% Q 62.5% 65%, 75% 50%"
                        stroke="rgba(105, 227, 0, 0.2)"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="5,5"
                    />
                    {/* Runtime to Ghostwriter */}
                    <path
                        d="M 75% 50% Q 87.5% 35%, 95% 50%"
                        stroke="rgba(105, 227, 0, 0.2)"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="5,5"
                    />
                    {/* Orchestrator to Runtime (cross connection) */}
                    <path
                        d="M 25% 50% Q 50% 25%, 75% 50%"
                        stroke="rgba(105, 227, 0, 0.1)"
                        strokeWidth="1.5"
                        fill="none"
                        strokeDasharray="3,3"
                    />
                </svg>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative" style={{ zIndex: 1 }}>
                    {agents.map((agent) => (
                        <div
                            key={agent.id}
                            onMouseEnter={() => setHoveredAgent(agent.id)}
                            onMouseLeave={() => setHoveredAgent(null)}
                            className="group relative bg-[#171717] border border-white/5 rounded-2xl p-6 hover:shadow-[0_0_40px_rgba(105,227,0,0.5)] transition-all duration-300 hover:-translate-y-1"
                        >
                            {/* Status Indicator */}
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${agent.status === "running"
                                    ? "bg-[#69E300] animate-pulse"
                                    : agent.status === "completed"
                                        ? "bg-[#69E300]"
                                        : "bg-white/20"
                                    }`} />
                                <span className="text-[10px] text-[#71717A] uppercase tracking-wider font-mono">
                                    {agent.status}
                                </span>
                            </div>

                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${hoveredAgent === agent.id
                                ? "bg-[#69E300]/10 text-[#69E300]"
                                : "bg-white/5 text-white/60"
                                }`}>
                                {agent.icon}
                            </div>

                            {/* Agent Info */}
                            <h3 className="text-lg font-bold text-[#F8F7F8] mb-1 font-display">
                                {agent.name}
                            </h3>
                            <p className="text-sm text-[#71717A] mb-3 font-medium">
                                {agent.role}
                            </p>
                            <p className="text-sm text-[#A1A1A1] leading-relaxed mb-4">
                                {agent.description}
                            </p>

                            {/* Capabilities */}
                            <div className="space-y-2">
                                <p className="text-xs text-[#71717A] uppercase tracking-wider font-mono mb-2">
                                    Capabilities
                                </p>
                                <ul className="space-y-1.5">
                                    {agent.capabilities.map((capability, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-[#A1A1A1]">
                                            <span className="w-1 h-1 rounded-full bg-[#69E300] mt-2 flex-shrink-0" />
                                            <span>{capability}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Trust & Observability Callout */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-6 rounded-2xl border border-white/5 bg-[#171717]">
                <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-[#69E300]" />
                    <p className="text-sm text-[#A1A1A1]">
                        Every agent action is fully traceable and observable via Weights & Biases
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-[#69E300] text-[#69E300] hover:bg-[#69E300]/10 font-medium"
                >
                    View Sample Trace
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </section>
    )
}
