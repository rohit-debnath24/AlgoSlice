"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import Image from "next/image"
import { Terminal, User, Mail, Lock, Chrome, Github } from "lucide-react"

export function SignUpForm() {
  const searchParams = useSearchParams()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      message:
        password.length < minLength
          ? "Access key requires minimum 8-character entropy"
          : !hasUpperCase || !hasLowerCase
            ? "Access key must combine upper and lowercase protocols"
            : !hasNumbers
              ? "Access key must include numeric cipher elements"
              : !hasSpecialChar
                ? "Access key requires special character token"
                : "",
    }
  }

  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam === "no_account") {
      setError("No operator profile found. Please register to initialize access.")
    } else if (errorParam === "local_account_exists") {
      setError("Collision detected: Operator profile already exists with this identity.")
    } else if (errorParam === "account_exists") {
      setError("Identity already registered. Please authenticate via login terminal.")
    } else if (errorParam === "oauth_failed") {
      setError("External provider handshake failed. Please retry registration.")
    }
  }, [searchParams])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!validateEmail(email)) {
      setError("Invalid Protocol: Please provide a valid communication endpoint (email).")
      setIsLoading(false)
      return
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message)
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Security Mismatch: Access keys do not match protocol requirements.")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Operator registration sequence failed.")
      }

      // Redirect to dashboard with userId
      window.location.href = `/dashboard/${data.user.userId}`
    } catch (err: any) {
      console.error("Registration error", err)
      setError(err.message || "System Error: Unable to complete operator registration.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = () => {
    window.location.href = "/api/auth/google"
  }

  const handleGitHubSignUp = () => {
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
              src="/signup-page-banner.jpeg"
              alt="Signup Page Banner"
              fill
              className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex items-start justify-center p-6 md:p-12 pt-8 md:pt-12 relative overflow-y-auto">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#69E300]/5 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md space-y-8 relative z-10 pb-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-3xl font-display font-bold text-white tracking-tight">
                Join the <span className="text-[#69E300]">Ghostwriter Network.</span>
              </h2>
              <p className="mt-2 text-white/40 font-medium italic">Create a Ghostwriter account</p>
              <p className="mt-2 text-white/40 font-medium italic">Initialize new profile...</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm font-mono flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                  First Name
                </label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#69E300] transition-colors" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="h-11 pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#69E300]/50 transition-all rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                  Last Name
                </label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#69E300] transition-colors" />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="h-11 pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#69E300]/50 transition-all rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
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
                  className="h-11 pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#69E300]/50 transition-all rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                Access Key (Password)
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#69E300] transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#69E300]/50 transition-all rounded-xl"
                />
              </div>
              <p className="text-[9px] text-white/30 font-mono mt-1 leading-relaxed">
                Requires 8+ chars with uppercase, lowercase, numeric, and special tokens
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60"
              >
                Confirm Access Key
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#69E300] transition-colors" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-11 pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#69E300]/50 transition-all rounded-xl"
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
                  Initializing Profile...
                </div>
              ) : (
                "Register"
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
              onClick={handleGoogleSignUp}
              type="button"
            >
              <Chrome className="w-4 h-4" />
              Google
            </Button>
            <Button
              variant="outline"
              className="h-12 gap-3 bg-white/[0.02] border-white/5 text-white/60 hover:text-white hover:border-white/20 rounded-xl font-mono text-xs transition-all"
              onClick={handleGitHubSignUp}
              type="button"
            >
              <Github className="w-4 h-4" />
              GitHub
            </Button>
          </div>

          <p className="text-center text-[11px] text-white/20 font-bold uppercase tracking-widest">
            Already Registered?{" "}
            <Link href="/login" className="text-[#69E300] hover:underline">
              Access Login Terminal
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
