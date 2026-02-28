"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { UserProfileButton } from "@/components/user-profile-button"

export function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      setIsAuthenticated(data.authenticated)
      if (data.authenticated && data.user) {
        setUserId(data.user.userId)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProtectedLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (!isAuthenticated) {
      e.preventDefault()
      window.location.href = '/login'
    }
  }

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-6 sm:px-8 lg:px-12 xl:px-16 max-w-[1400px]">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#69E300]/10 border border-[#69E300]/30 transition-all group-hover:bg-[#69E300]/20 group-hover:shadow-[0_0_15px_rgba(105,227,0,0.3)] overflow-hidden">
            <Image
              src="/logo.png"
              alt="Ghostwriter Logo"
              width={32}
              height={32}
              className="object-cover w-full h-full"
            />
          </div>
          <span className="text-lg font-display font-bold tracking-tight text-white">Ghostwriter</span>
        </Link>

        {/* Center Links Section */}
        <div className="hidden md:flex items-center justify-center gap-8">
          <Link
            href="/"
            className="text-sm font-medium text-white/60 hover:text-[#69E300] transition-colors"
          >
            Home
          </Link>
          <Link
            href={isAuthenticated && userId ? `/dashboard/${userId}` : '/login'}
            onClick={(e) => handleProtectedLink(e, `/dashboard/${userId}`)}
            className="text-sm font-medium text-white/60 hover:text-[#69E300] transition-colors"
          >
            Dashboard
          </Link>
          <a
            href="/#features"
            className="text-sm font-medium text-white/60 hover:text-[#69E300] transition-colors"
            onClick={(e) => {
              e.preventDefault()
              const element = document.getElementById('features')
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' })
              } else {
                window.location.href = '/#features'
              }
            }}
          >
            Product
          </a>
          <a
            href="/#agents"
            className="text-sm font-medium text-white/60 hover:text-[#69E300] transition-colors"
            onClick={(e) => {
              e.preventDefault()
              const element = document.getElementById('agents')
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' })
              } else {
                window.location.href = '/#agents'
              }
            }}
          >
            Agents
          </a>
          <Link
            href={isAuthenticated && userId ? `/trace/${userId}` : '/login'}
            onClick={(e) => handleProtectedLink(e, `/trace/${userId}`)}
            className="text-sm font-medium text-white/60 hover:text-[#69E300] transition-colors"
          >
            Observability
          </Link>
          <a
            href="/#features"
            className="text-sm font-medium text-white/60 hover:text-[#69E300] transition-colors"
            onClick={(e) => {
              e.preventDefault()
              const element = document.getElementById('features')
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' })
              } else {
                window.location.href = '/#features'
              }
            }}
          >
            Security
          </a>
        </div>

        <div className="flex items-center gap-4">
          {!isLoading && (
            <>
              {isAuthenticated ? (
                <UserProfileButton />
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild className="hidden text-white/60 hover:text-white md:inline-flex">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="hidden text-white/60 hover:text-white md:inline-flex">
                    <Link href="/sign-up">Register</Link>
                  </Button>
                </>
              )}
            </>
          )}
          <Button size="sm" className="bg-[#69E300] text-black hover:bg-[#5bc200] font-semibold">
            GhostWriter Agent
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>
    </nav>
  )
}
