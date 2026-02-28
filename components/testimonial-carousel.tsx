"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Star, User, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { FeedbackModal } from "@/components/ui/feedback-modal"

// Default testimonial data
const defaultTestimonials = [
  {
    name: "Marcus Thorne",
    country: "Cloud Infrastructure Lead",
    type: "Enterprise",
    avatar: "https://i.pravatar.cc/150?u=marcus",
    feedback:
      "The agentic orchestration in Ghostwriter has transformed our CI/CD pipeline. We've seen a 40% reduction in deployment failures due to autonomous pre-flight audits.",
    rating: 5,
  },
  {
    name: "Dr. Sarah Chen",
    country: "USA",
    type: "Enterprise",
    avatar: "https://i.pravatar.cc/150?u=sarah",
    feedback:
      "MoleculeInsight cut our preliminary research phase by 60%. The agentic AI orchestration finds connections across patents and clinical trials we missed manually.",
    rating: 5,
  },
  {
    name: "James Wilson",
    country: "UK",
    type: "Scale-up",
    avatar: "https://i.pravatar.cc/150?u=james",
    feedback:
      "The comprehensive PDF reports generated are board-ready. It's like having a dedicated analyst team working 24/7 on molecule repurposing opportunities.",
    rating: 4,
  },
  {
    name: "Elena Rodriguez",
    country: "Spain",
    type: "FinTech",
    avatar: "https://i.pravatar.cc/150?u=elena",
    feedback:
      "Deep data retrieval from multiple sources is seamless. I can trust the data quality because it links directly to the source documents.",
    rating: 5,
  },
  {
    name: "Akira Tanaka",
    country: "Japan",
    type: "Enterprise",
    avatar: "https://i.pravatar.cc/150?u=akira",
    feedback:
      "For evaluating biotech startups, this tool is indispensable. It quickly validates claims and highlights the competitive landscape in minutes.",
    rating: 4,
  },
  {
    name: "Dr. Emily Clarke",
    country: "Canada",
    type: "Scale-up",
    avatar: "https://i.pravatar.cc/150?u=emily",
    feedback:
      "The ease of use is remarkable. Just entering a molecule name gives me a holistic view from molecular properties to current market status.",
    rating: 5,
  },
]

const people = [
  {
    id: 1,
    name: "John Doe",
    designation: "Software Engineer",
    image:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3387&q=80",
  },
  {
    id: 2,
    name: "Robert Johnson",
    designation: "Product Manager",
    image:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
  },
  {
    id: 3,
    name: "Jane Smith",
    designation: "Data Scientist",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YXZhdGFyfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
  },
  {
    id: 4,
    name: "Emily Davis",
    designation: "UX Designer",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
  },
  {
    id: 5,
    name: "Tyler Durden",
    designation: "Soap Developer",
    image:
      "https://images.unsplash.com/photo-1472099644761-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80",
  },
  {
    id: 6,
    name: "Dora",
    designation: "The Explorer",
    image:
      "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3534&q=80",
  },
]

// Simple AnimatedTooltip component
function AnimatedTooltip({ items }: { items: typeof people }) {
  return (
    <div className="flex flex-row items-center">
      {items.map((item, idx) => (
        <div key={item.id} className="relative group -ml-4 first:ml-0" style={{ zIndex: items.length - idx }}>
          <img
            src={item.image || "/placeholder.svg"}
            alt={item.name}
            className="w-10 h-10 rounded-full border-2 border-background object-cover transition-transform group-hover:scale-110"
          />
        </div>
      ))}
    </div>
  )
}

export default function TestimonialCarousel() {
  const [testimonials] = useState(defaultTestimonials)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()
  const [userFeedbacks, setUserFeedbacks] = useState<any[]>([])
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const allTestimonials = [...testimonials, ...userFeedbacks]

  useEffect(() => {
    // Check if user is authenticated
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setIsAuthenticated(data.authenticated || false)
      })
      .catch((err) => {
        console.error("Failed to check auth:", err)
        setIsAuthenticated(false)
      })
      .finally(() => {
        setIsCheckingAuth(false)
      })
  }, [])

  const fetchFeedbacks = async () => {
    try {
      console.log("Fetching user feedbacks...")

      // Get current user session for latest avatar
      const sessionRes = await fetch("/api/auth/session")

      if (!sessionRes.ok) {
        if (sessionRes.status === 401) {
          console.log("User not logged in (guest)")
        } else {
          console.error("Session check failed:", sessionRes.status)
        }
        return
      }

      const sessionData = await sessionRes.json()
      const currentUserEmail = sessionData.authenticated ? sessionData.user.email : null
      const currentUserAvatar = sessionData.authenticated ? sessionData.user.avatar : null
      const currentUserName = sessionData.authenticated ? sessionData.user.name : null

      const res = await fetch("/api/get-feedbacks")

      if (!res.ok) {
        console.error("Feedback fetch failed:", res.status)
        return
      }

      const data = await res.json()
      console.log("Fetched feedbacks:", data.feedbacks?.length || 0)

      if (data.feedbacks) {
        const formatted = data.feedbacks.map((f: any) => ({
          name: f.userEmail === currentUserEmail ? currentUserName || f.userName : f.userName,
          country: f.country || "Unknown",
          type: f.userType,
          avatar: f.userEmail === currentUserEmail ? currentUserAvatar : f.userAvatar || null,
          feedback: f.feedback,
          rating: f.rating,
        }))
        setUserFeedbacks(formatted)
      }
    } catch (err) {
      console.error("Failed to fetch feedbacks:", err)
    }
  }

  useEffect(() => {
    fetchFeedbacks()

    // Listen for feedback updates
    const handleFeedbackUpdate = () => {
      fetchFeedbacks()
    }

    window.addEventListener("feedbackSubmitted", handleFeedbackUpdate)
    return () => window.removeEventListener("feedbackSubmitted", handleFeedbackUpdate)
  }, [])

  useEffect(() => {
    const handleAvatarUpdate = (event: any) => {
      const { avatar } = event.detail
      // Refresh feedbacks to update avatar
      fetchFeedbacks()
    }

    window.addEventListener("userUpdated", handleAvatarUpdate)
    return () => window.removeEventListener("userUpdated", handleAvatarUpdate)
  }, [])

  const handleStartAnalysis = () => {
    if (!isAuthenticated) {
      router.push("/login")
    } else {
      router.push("/analysis")
    }
  }

  const handleShareFeedback = () => {
    if (!isAuthenticated) {
      router.push("/login")
    } else {
      setShowFeedbackModal(true)
    }
  }

  return (
    <section id="testimonials" className="relative py-24 bg-transparent overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 mb-16 text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#69E300]/20 bg-[#69E300]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#69E300]">
          Wall of Confidence
        </div>
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
          Trusted by <span className="text-[#69E300]">Industry Leaders</span>
        </h2>
        <p className="text-lg text-white/60 max-w-2xl mx-auto text-pretty">
          See how teams are accelerating discovery with our autonomous AI agents.
        </p>

        {/* Avatars Section */}
        <div className="flex flex-col items-center gap-4 mt-8">
          <div className="flex flex-row items-center justify-center w-full">
            <AnimatedTooltip items={people} />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#69E300]">
            Empowering 1,200+ Engineering Teams
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden w-full py-4 mb-2">
        {/* Gradients for fade effect on edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0a0809] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0a0809] to-transparent z-10 pointer-events-none" />

        <div
          className="flex animate-marquee"
          style={{
            width: "max-content",
          }}
        >
          {allTestimonials.map((testimonial, index) => (
            <div key={`first-${index}`} className="px-4 flex-shrink-0" style={{ width: "450px" }}>
              <TestimonialCard testimonial={testimonial} />
            </div>
          ))}

          {allTestimonials.map((testimonial, index) => (
            <div key={`second-${index}`} className="px-4 flex-shrink-0" style={{ width: "450px" }}>
              <TestimonialCard testimonial={testimonial} />
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <Button
            onClick={handleShareFeedback}
            disabled={isCheckingAuth}
            className="h-14 px-8 rounded-full bg-[#69E300] text-black hover:bg-[#69E300]/90 font-bold text-base shadow-xl shadow-[#69E300]/5"
          >
            {isCheckingAuth ? "Syncing..." : "Share Your Experience"}
          </Button>
        </div>
      </div>
      <FeedbackModal
        isOpen={showFeedbackModal}
        onOpenChange={setShowFeedbackModal}
        onAuthRequired={() => router.push("/login")}
      />

      <style jsx global>{`
                @keyframes marquee {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
    </section>
  )
}

function TestimonialCard({ testimonial }: { testimonial: any }) {
  return (
    <Card
      className="relative group transition-all duration-500 h-full border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#69E300]/20 rounded-3xl overflow-hidden backdrop-blur-sm"
      style={{ minHeight: "280px" }}
    >
      <div className="absolute top-0 right-0 p-6 text-white/5 group-hover:text-[#69E300]/10 transition-colors">
        <Quote className="w-12 h-12 rotate-180" />
      </div>

      <CardContent className="p-8 flex flex-col h-full relative z-10">
        <div className="flex items-center space-x-4 mb-6">
          {testimonial.avatar ? (
            <div className="relative">
              <img
                src={testimonial.avatar || "/placeholder.svg"}
                alt={testimonial.name}
                className="w-14 h-14 rounded-2xl border border-white/10 object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#69E300] rounded-full border-2 border-[#0a0809]" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-[#69E300]/10 flex items-center justify-center border border-[#69E300]/20">
              <User className="w-7 h-7 text-[#69E300]" />
            </div>
          )}
          <div>
            <h4 className="font-bold text-white text-lg tracking-tight">{testimonial.name}</h4>
            <p className="text-xs font-medium uppercase tracking-widest text-[#69E300]/70">{testimonial.country}</p>
          </div>
        </div>

        <p className="text-white/60 text-base leading-relaxed text-pretty flex-grow mb-6 group-hover:text-white/90 transition-colors italic">
          "{testimonial.feedback}"
        </p>

        <div className="flex justify-between items-center mt-auto pt-6 border-t border-white/5">
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${star <= (testimonial.rating || 5) ? "fill-[#69E300] text-[#69E300]" : "fill-none text-white/10"
                  }`}
              />
            ))}
          </div>
          <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-white/5 text-white/40 border border-white/10 group-hover:border-[#69E300]/30 group-hover:text-[#69E300] transition-all">
            {testimonial.type}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
