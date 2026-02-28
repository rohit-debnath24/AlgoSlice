"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Check, Tag } from "lucide-react"

export function PricingSection() {
    const pricingPlans = [
        {
            name: "Starter",
            price: "₹0",
            frequency: "/month",
            description: "Perfect for small teams getting started with predictive threat intelligence.",
            features: [
                "Monitor up to 50 assets",
                "Basic threat predictions",
                "Attack graph visualization",
                "7-day data retention",
                "Community support",
            ],
            buttonText: "Get Started Free",
            highlighted: false,
        },
        {
            name: "Professional",
            price: "₹4,999",
            frequency: "/month",
            description: "For security teams requiring advanced predictive analytics and autonomous response.",
            features: [
                "Monitor up to 500 assets",
                "Advanced AI-driven predictions",
                "Real-time attack simulations",
                "30-day data retention",
                "Priority support & SOC assistance",
                "Custom MITRE ATT&CK mapping",
            ],
            buttonText: "Upgrade to Pro",
            highlighted: true,
        },
        {
            name: "Enterprise",
            price: "Custom",
            frequency: "",
            description: "Tailored for large organizations requiring full-scale threat orchestration.",
            features: [
                "Unlimited asset monitoring",
                "Autonomous threat response",
                "Multi-tenant architecture",
                "Custom integrations & SSO",
                "24/7 dedicated security analyst",
                "On-premise deployment options",
            ],
            buttonText: "Contact Us",
            highlighted: false,
        },
    ]

    return (
        <section className="relative py-24 overflow-hidden border-t border-white/5">
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0809] via-[#69E300]/5 to-[#0a0809]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#69E300]/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 rounded-full border border-[#69E300]/20 bg-[#69E300]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#69E300] mb-6"
                    >
                        <Tag className="h-4 w-4" />
                        Pricing Plans
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                        Simple & <span className="text-[#69E300]">Transparent Plans</span>
                    </h2>
                    <p className="text-lg text-white/60 max-w-2xl mx-auto">
                        Choose the plan that fits your security needs — from startups exploring predictive defense to enterprises requiring full-scale threat orchestration.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {pricingPlans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className={`relative group rounded-3xl p-8 flex flex-col backdrop-blur-sm transition-all duration-300 ${plan.highlighted
                                ? "bg-gradient-to-br from-[#69E300]/20 to-[#69E300]/5 border-2 border-[#69E300]/50 shadow-lg shadow-[#69E300]/20 scale-105"
                                : "bg-white/[0.02] border border-white/10 hover:border-4 hover:border-dotted hover:border-[#69E300] hover:bg-white/[0.05]"
                                }`}
                        >
                            {plan.highlighted && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#69E300] text-black text-xs font-bold uppercase tracking-widest">
                                    Most Popular
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold text-white mb-4">{plan.name}</h3>
                                <div className="mb-4">
                                    <span className={`text-5xl font-bold text-white ${plan.highlighted ? "text-[#69E300]" : ""}`}>
                                        {plan.price}
                                    </span>
                                    {plan.frequency && <span className="text-lg text-white/60">{plan.frequency}</span>}
                                </div>
                                <p className="text-white/60 text-sm leading-relaxed">{plan.description}</p>
                            </div>

                            <ul className="space-y-3 mb-8 flex-grow">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start text-sm">
                                        <Check
                                            className={`h-5 w-5 mr-3 flex-shrink-0 mt-0.5 ${plan.highlighted ? "text-[#69E300]" : "text-[#69E300]/70"
                                                }`}
                                        />
                                        <span className="text-white/80">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className={`w-full rounded-full font-bold transition-all ${plan.highlighted
                                    ? "bg-[#69E300] hover:bg-[#69E300]/90 text-black shadow-lg shadow-[#69E300]/30 hover:scale-105"
                                    : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                                    }`}
                            >
                                {plan.buttonText}
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
