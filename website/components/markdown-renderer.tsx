"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MarkdownRendererProps {
    content: string
}

export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                p: ({ node, ...props }) => <p className="text-xs text-white/70 leading-relaxed mb-2 last:mb-0" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 mb-2 text-xs text-white/70" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 mb-2 text-xs text-white/70" {...props} />,
                li: ({ node, ...props }) => <li className="pl-1 marker:text-[#69E300]/50" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-bold text-white/90" {...props} />,
                a: ({ node, ...props }) => <a className="text-[#69E300] hover:underline underline-offset-2" target="_blank" rel="noopener noreferrer" {...props} />,
                code: ({ node, ...props }) => (
                    <code className="bg-black/40 border border-white/5 rounded px-1 py-0.5 font-mono text-[10px] text-[#69E300]" {...props} />
                ),
                h1: ({ node, ...props }) => <h3 className="text-sm font-bold text-white mb-2 mt-1" {...props} />,
                h2: ({ node, ...props }) => <h4 className="text-xs font-bold text-white mb-1 mt-1" {...props} />,
                h3: ({ node, ...props }) => <h5 className="text-xs font-bold text-white mb-1" {...props} />,
            }}
        >
            {content}
        </ReactMarkdown>
    )
}
