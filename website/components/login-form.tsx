"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import Image from "next/image"
import { Terminal, Fingerprint, Mail, Github, Chrome } from "lucide-react"

export function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam === "no_account") {
      setError("Authorization denied: No operator account linked to this identity.")
    } else if (errorParam === "local_account_exists") {
      setError("Collision detected: An account already exists with this primary identity.")
    } else if (errorParam === "oauth_failed") {
      setError("Handshake failed: Unable to verify identity via external provider.")
    }
  }, [searchParams])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!validateEmail(email)) {
      setError("Invalid Protocol: Please provide a valid communication endpoint (email).")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Access Denied: Authentication subsystem failure.")
        setIsLoading(false)
        return
      }

      // Redirect to dashboard on success
      const username = email.split('@')[0]
      window.location.href = `/dashboard/${username}`
    } catch (err: any) {
      setError(err.message || "Access Denied: Authentication subsystem failure.")
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google"
  }

  const handleGitHubLogin = () => {
    window.location.href = "/api/auth/github"
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0809] font-sans selection:bg-[#69E300]/30 pt-16">
      {/* Left Side - Image */}
      <div className="relative hidden lg:flex w-1/2 flex-col items-center justify-center border-r border-white/5 bg-[#0a0809]">
        <div className="relative z-10 w-full h-full">
          <div className="relative w-full h-full overflow-hidden bg-white/[0.02] backdrop-blur-sm group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#69E300]/10 to-transparent z-10 opacity-50" />
            <Image
              src="/high-tech-devops-mission-control-interface.jpg"
              alt="Ghostwriter Core Interface"
              fill
              className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#69E300]/5 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md space-y-10 relative z-10">
          <div className="space-y-4">
            <div>
              <h2 className="text-3xl font-display font-bold text-white tracking-tight">Welcome Back!</h2>
              <p className="mt-1 text-white/40 font-medium italic">Login to your account<br />It's nice to see you again. Ready to code?</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm font-mono flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          )}

          <div className="space-y-6">
            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-1">
                <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                  Network Identifier (Email)
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#69E300] transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="operator@ghostwriter.sh"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#69E300]/50 transition-all rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                    Access Key (Password)
                  </label>
                  <Link
                    href="/forgot"
                    className="text-[10px] font-bold uppercase tracking-widest text-[#69E300] hover:text-[#5bc200] transition-colors"
                  >
                    Reset Key
                  </Link>
                </div>
                <div className="relative group">
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#69E300] transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#69E300]/50 transition-all rounded-xl"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-sm font-bold uppercase tracking-[0.2em] bg-[#69E300] text-black hover:bg-[#5bc200] rounded-xl shadow-[0_0_20px_rgba(105,227,0,0.2)] transition-all active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    Authenticating...
                  </div>
                ) : (
                  "Submit"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em]">
                <span className="px-4 bg-[#0a0809] text-white/20 font-bold italic">Or Proxy via</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-12 gap-3 bg-white/[0.02] border-white/5 text-white/60 hover:text-white hover:border-white/20 rounded-xl font-mono text-xs transition-all"
                onClick={handleGoogleLogin}
                type="button"
              >
                <Chrome className="w-4 h-4" />
                Google
              </Button>
              <Button
                variant="outline"
                className="h-12 gap-3 bg-white/[0.02] border-white/5 text-white/60 hover:text-white hover:border-white/20 rounded-xl font-mono text-xs transition-all"
                onClick={handleGitHubLogin}
                type="button"
              >
                <Github className="w-4 h-4" />
                GitHub
              </Button>
            </div>

            <p className="text-center text-[11px] text-white/20 font-bold uppercase tracking-widest">
              Unregistered Identity?{" "}
              <Link href="/sign-up" className="text-[#69E300] hover:underline">
                Register Operator
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
