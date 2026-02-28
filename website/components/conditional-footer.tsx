"use client"

import { usePathname } from "next/navigation"
import { Footer } from "@/components/footer"

export function ConditionalFooter() {
  const pathname = usePathname()
  
  // Don't show footer on auth pages
  const hideFooter = pathname === "/login" || pathname === "/sign-up"
  
  if (hideFooter) {
    return null
  }
  
  return <Footer />
}
