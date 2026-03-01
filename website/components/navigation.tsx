"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Menu, LogOut, Wallet } from "lucide-react"
import { useWallet } from "@txnlab/use-wallet-react"
import { UserProfileButton } from "@/components/user-profile-button"

export function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const { activeAddress, wallets } = useWallet()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      // Merge Web2 auth and Web3 wallet status
      setIsAuthenticated(data.authenticated || !!activeAddress)
      if (data.authenticated && data.user) {
        setUserId(data.user.userId)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectLute = async () => {
    try {
      const luteWallet = wallets?.find(w => w.id === "lute")
      if (luteWallet) {
        await luteWallet.connect()
      } else {
        console.error("Lute wallet provider not found in use-wallet configuration.")
      }
    } catch (e) {
      console.error("Error connecting to Lute:", e)
    }
  }

  const handleDisconnect = async () => {
    try {
      const active = wallets?.find(w => w.isActive)
      if (active) await active.disconnect()
    } catch (e) {
      console.error("Error disconnecting:", e)
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
            <div className="text-[#69E300] font-bold text-xs">GPUX</div>
          </div>
          <span className="text-xl font-display font-bold tracking-tight text-white uppercase">gpux</span>
        </Link>

        {/* Center Links Section */}
        <div className="hidden md:flex items-center justify-center gap-8">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-200 hover:text-[#69E300] transition-colors"
          >
            Home
          </Link>
          <Link
            href="/marketplace"
            className="text-sm font-medium text-zinc-200 hover:text-[#69E300] transition-colors"
          >
            Marketplace
          </Link>
          <Link
            href="/list-gpu"
            className="text-sm font-medium text-zinc-200 hover:text-[#69E300] transition-colors"
          >
            List GPU
          </Link>
          <a
            href="/#how-it-works"
            className="text-sm font-medium text-zinc-200 hover:text-[#69E300] transition-colors truncate max-w-[120px]"
            onClick={(e) => {
              e.preventDefault()
              const element = document.getElementById('how-it-works')
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' })
              }
            }}
          >
            How It Works
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
              {activeAddress ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-[#69E300]/30 text-[#69E300] bg-[#69E300]/5 px-3 py-1 font-mono text-xs">
                    <Wallet className="w-3 h-3 mr-2 inline" />
                    {activeAddress.slice(0, 5)}...{activeAddress.slice(-4)}
                  </Badge>
                  <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-red-400" onClick={handleDisconnect} title="Disconnect Wallet">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : isAuthenticated ? (
                <UserProfileButton />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden md:flex bg-transparent border-zinc-700 hover:bg-zinc-800 text-white gap-2 font-mono whitespace-nowrap"
                  onClick={handleConnectLute}
                >
                  <Image src="https://lute.app/favicon.ico" alt="Lute Logo" width={16} height={16} className="rounded-full" />
                  Connect Lute
                </Button>
              )}
            </>
          )}
          <Button size="sm" className="bg-[#69E300] text-black hover:bg-[#5bc200] font-semibold" asChild>
            <Link href="/marketplace">Rent a GPU</Link>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>
    </nav>
  )
}
