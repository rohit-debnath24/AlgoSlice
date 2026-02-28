import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"

export const metadata = {
  title: "Login | Ghostwriter",
  description: "Secure access to the Ghostwriter DevOps Agentic Platform.",
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0809] flex items-center justify-center font-mono text-[#69E300] text-xs uppercase tracking-[0.5em] animate-pulse">
          Initialising Secure Channel...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
