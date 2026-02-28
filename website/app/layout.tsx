import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ConditionalFooter } from "@/components/conditional-footer"
import { Navigation } from "@/components/navigation"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })
const _spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" })

export const metadata: Metadata = {
  title: "DevOps-Ghostwriter",
  description: "Automate your infrastructure at the speed of thought with Ghostwriter's AI-powered DevOps platform",
  generator: "Next.js",
  icons: {
    icon: [
      {
        url: "/logo.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logo.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${_geist.variable} ${_geistMono.variable} ${_spaceGrotesk.variable} font-sans antialiased selection:bg-primary/30 bg-[#0a0809] text-white`}
      >
        <Navigation />
        {children}
        <ConditionalFooter />
        <Analytics />
      </body>
    </html>
  )
}
