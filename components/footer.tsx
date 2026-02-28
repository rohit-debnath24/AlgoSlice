import { Terminal, Github, Twitter, Linkedin, Mail } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0a0809] pt-20 pb-12">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 max-w-[1400px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#69E300]/10 border border-[#69E300]/30">
                <img src="/logo.png" alt="Ghostwriter Logo" className="h-6 w-6 object-contain" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white uppercase tracking-widest">Ghostwriter</span>
            </Link>
            <p className="text-sm text-white/40 leading-relaxed max-w-xs">
              Autonomous AI agents for secure, scalable, and high-performance DevOps automation.
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-[#69E300] hover:bg-white/10 transition-all"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-[#69E300] hover:bg-white/10 transition-all"
              >
                <Github className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-[#69E300] hover:bg-white/10 transition-all"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-6">Product</h4>
            <ul className="space-y-4">
              <li>
                <Link href="#" className="text-sm text-white/40 hover:text-[#69E300] transition-colors">
                  Agents
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-white/40 hover:text-[#69E300] transition-colors">
                  Repositories
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-white/40 hover:text-[#69E300] transition-colors">
                  Live Audit
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-white/40 hover:text-[#69E300] transition-colors">
                  Infrastructure
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-6">Company</h4>
            <ul className="space-y-4">
              <li>
                <Link href="#" className="text-sm text-white/40 hover:text-[#69E300] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-white/40 hover:text-[#69E300] transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-white/40 hover:text-[#69E300] transition-colors">
                  Docs
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-white/40 hover:text-[#69E300] transition-colors">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-6">Newsletter</h4>
            <p className="text-sm text-white/40 mb-4">Stay updated with the latest agentic DevOps trends.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="email@example.com"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#69E300]/50 transition-colors"
                suppressHydrationWarning
              />
              <button
                suppressHydrationWarning
                className="bg-[#69E300] text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#5bc200] transition-colors"
              >
                <Mail className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>


      </div>
    </footer>
  )
}
