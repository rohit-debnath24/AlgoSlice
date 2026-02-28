import { Suspense } from "react"
import { SignUpForm } from "@/components/signup-form"

export const metadata = {
  title: "Sign Up | Ghostwriter",
  description: "Register for the Ghostwriter DevOps Agentic Platform.",
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0809] flex items-center justify-center font-mono text-[#69E300] text-xs uppercase tracking-[0.5em] animate-pulse">
          Initialising Registration Protocol...
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  )
}
