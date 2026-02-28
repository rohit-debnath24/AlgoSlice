"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Star } from "lucide-react"

interface FeedbackModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onAuthRequired?: () => void
}

export function FeedbackModal({
  isOpen,
  onOpenChange,
  onAuthRequired,
}: FeedbackModalProps) {
  const [rating, setRating] = useState(5)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [userType, setUserType] = useState("")
  const [country, setCountry] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Check authentication
      const sessionRes = await fetch("/api/auth/session")
      const sessionData = await sessionRes.json()

      if (!sessionData.authenticated) {
        onAuthRequired?.()
        return
      }

      // Submit feedback
      const res = await fetch("/api/submit-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback,
          rating,
          userType,
          country,
        }),
      })

      if (res.ok) {
        // Dispatch event for testimonial carousel to refresh
        window.dispatchEvent(new Event("feedbackSubmitted"))
        
        // Reset form
        setFeedback("")
        setRating(5)
        setUserType("")
        setCountry("")
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#0a0809] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Share Your Experience
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Help us improve by sharing your feedback with the community.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Rating */}
          <div className="space-y-2">
            <Label className="text-white">Rating</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-[#69E300] text-[#69E300]"
                        : "fill-none text-white/20"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* User Type */}
          <div className="space-y-2">
            <Label htmlFor="userType" className="text-white">
              Role
            </Label>
            <Select value={userType} onValueChange={setUserType}>
              <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0809] border-white/10">
                <SelectItem value="Enterprise">Enterprise</SelectItem>
                <SelectItem value="Scale-up">Scale-up</SelectItem>
                <SelectItem value="Startup">Startup</SelectItem>
                <SelectItem value="FinTech">FinTech</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label htmlFor="country" className="text-white">
              Location / Company
            </Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g., USA, CTO @ TechCorp"
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback" className="text-white">
              Your Feedback
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your experience with Ghostwriter..."
              required
              className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-white/10 bg-white/5 hover:bg-white/10 text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !feedback || !userType || !country}
              className="flex-1 bg-[#69E300] text-black hover:bg-[#5bc200] font-bold"
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
