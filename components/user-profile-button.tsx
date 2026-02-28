"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserSession {
    userId: string
    email: string
    name?: string
    avatar?: string
    provider?: 'local' | 'github' | 'google'
}

export function UserProfileButton() {
    const [user, setUser] = useState<UserSession | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        checkSession()
    }, [])

    const checkSession = async () => {
        try {
            const response = await fetch('/api/auth/session')
            const data = await response.json()

            if (data.authenticated && data.user) {
                setUser(data.user)
            }
        } catch (error) {
            console.error('Error checking session:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            router.push('/login')
            router.refresh()
        } catch (error) {
            console.error('Error logging out:', error)
        }
    }

    const handleDashboard = () => {
        if (user?.userId) {
            router.push(`/dashboard/${user.userId}`)
        }
    }

    if (isLoading) {
        return null
    }

    if (!user) {
        return null
    }

    const getInitials = (name?: string, email?: string) => {
        if (name) {
            const parts = name.split(' ')
            if (parts.length >= 2) {
                return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
            }
            return name.substring(0, 2).toUpperCase()
        }
        if (email) {
            return email.substring(0, 2).toUpperCase()
        }
        return 'U'
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 px-3 py-1.5 rounded-full ring-2 ring-white/10 hover:ring-[#69E300]/50 transition-all cursor-pointer focus:outline-none focus:ring-[#69E300]/50 bg-white/5 hover:bg-white/10">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar} alt={user.name || user.email} />
                        <AvatarFallback className="bg-[#69E300]/20 text-[#69E300] font-bold text-xs">
                            {getInitials(user.name, user.email)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium text-white pr-2">
                        {user.name || user.email.split('@')[0]}
                    </span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-56 bg-black/95 border-white/10 backdrop-blur-xl"
            >
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium text-white">{user.name || 'User'}</p>
                        <p className="text-xs text-white/40 truncate">{user.email}</p>
                        {user.provider && (
                            <p className="text-[10px] text-[#69E300] uppercase tracking-wider font-mono">
                                via {user.provider}
                            </p>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem
                    onClick={handleDashboard}
                    className="cursor-pointer text-white/80 hover:text-white hover:bg-white/5"
                >
                    <User className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="cursor-pointer text-white/80 hover:text-white hover:bg-white/5"
                >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
