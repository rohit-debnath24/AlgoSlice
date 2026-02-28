"use client"

import { motion } from "framer-motion"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { MessageCircle } from "lucide-react"

export function FAQSection() {
    const faqs = [
        {
            question: "How does the AI threat detection work?",
            answer:
                "Our advanced AI models analyze your codebase and infrastructure configurations in real-time, identifying patterns that match known security vulnerabilities and emerging threat vectors before they can be exploited.",
        },
        {
            question: "Is my source code secure?",
            answer:
                "Absolutely. We run our analysis in ephemeral, isolated environments. Your code is never stored on our servers permanently and is discarded immediately after analysis is complete.",
        },
        {
            question: "Can I integrate this with GitHub Actions?",
            answer:
                "Yes, we provide native integrations for GitHub Actions, GitLab CI, and Jenkins, allowing you to automate security scans as part of your existing pull request workflows.",
        },
        {
            question: "What languages do you support?",
            answer:
                "We currently support Python, JavaScript/TypeScript, Go, Java, and Rust, with more languages being added regularly.",
        },
        {
            question: "Do you offer on-premise deployment?",
            answer:
                "Yes, for Enterprise plans, we offer full on-premise or privacy-focused cloud deployments to ensure your data never leaves your controlled environment.",
        },
    ]

    return (
        <section className="relative py-12 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[#0a0809]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#69E300]/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-4xl mx-auto px-6 relative z-10">
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
                        <MessageCircle className="h-4 w-4" />
                        FAQ
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                        Frequently <span className="text-[#69E300]">Asked Questions</span>
                    </h2>
                    <p className="text-lg text-white/60 max-w-2xl mx-auto">
                        Everything you need to know about securing your DevOps pipeline with active intelligence.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {faqs.map((faq, index) => (
                            <AccordionItem
                                key={index}
                                value={`item-${index}`}
                                className="border border-white/10 rounded-lg bg-white/[0.02] px-6 data-[state=open]:border-[#69E300]/30 data-[state=open]:bg-white/[0.05] transition-all duration-300"
                            >
                                <AccordionTrigger className="text-lg font-medium text-white hover:text-[#69E300] hover:no-underline py-6">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-white/70 text-base pb-6 leading-relaxed">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </motion.div>
            </div>
        </section>
    )
}
