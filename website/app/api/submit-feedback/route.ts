import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log("[v0] Feedback submitted:", {
      rating: body.rating,
      userType: body.userType,
      country: body.country,
      feedback: body.feedback?.substring(0, 50) + "...",
    })

    // In production, this would save to a database
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
    })
  } catch (error) {
    console.error("[v0] Error submitting feedback:", error)
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 })
  }
}
