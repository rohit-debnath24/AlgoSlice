"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface Contributor {
    id: number
    name: string
    avatar: string
    commits: number
    prs: number
    role: string
    profileUrl?: string
}

interface RepoContributorsProps {
    contributors: Contributor[]
    owner: Contributor | null
}

export function RepoContributors({ contributors, owner }: RepoContributorsProps) {
    // Combine owner and contributors, with owner first if available
    const allContributors: Contributor[] = []

    if (owner) {
        allContributors.push(owner)
    }

    // Add other contributors (excluding owner if they're in the contributors list)
    contributors.forEach(contributor => {
        if (!owner || contributor.name !== owner.name) {
            allContributors.push(contributor)
        }
    })

    if (allContributors.length === 0) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold tracking-tight text-white">Top Contributors</h2>
                </div>
                <div className="rounded-xl border border-white/5 bg-[#171717] p-6 text-center">
                    <p className="text-white/40">No contributors data available</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight text-white">Top Contributors</h2>
                <Badge variant="outline" className="border-[#69E300]/20 bg-[#69E300]/10 text-[#69E300] text-[10px] font-bold uppercase tracking-widest">
                    {allContributors.length} Active
                </Badge>
            </div>

            <div className="rounded-xl border border-white/5 bg-[#171717] p-6">
                <div className={`${allContributors.length > 2 ? 'h-[240px] overflow-y-auto' : ''} space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20`}>
                    {allContributors.slice(0, 8).map((contributor, index) => (
                        <Link
                            key={contributor.id}
                            href={contributor.profileUrl || '#'}
                            target={contributor.profileUrl ? '_blank' : undefined}
                            className="flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-white/2 p-4 transition-all hover:border-white/10 hover:bg-white/4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Avatar className="h-10 w-10 border-2 border-white/10">
                                        <AvatarImage src={contributor.avatar} alt={contributor.name} />
                                        <AvatarFallback className="bg-[#69E300]/20 text-[#69E300] text-xs font-bold">
                                            {contributor.name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                    {contributor.role === 'Repository Owner' && (
                                        <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#69E300] text-[10px] font-black text-black">
                                            👑
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-white">{contributor.name}</p>
                                    </div>
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                                        {contributor.role}
                                    </p>
                                </div>
                            </div>


                        </Link>
                    ))}
                </div>


            </div>
        </div>
    )
}
