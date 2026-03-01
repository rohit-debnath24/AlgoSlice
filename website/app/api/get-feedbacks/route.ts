import { NextResponse } from "next/server"

export async function GET() {
  try {
    // <CHANGE> Mock endpoint returning empty feedbacks array
    // In production, this would fetch from a database
    return NextResponse.json({
      feedbacks: [],
    })
  } catch (error) {
    console.error("[v0] Error in get-feedbacks:", error)
    return NextResponse.json({ error: "Failed to fetch feedbacks" }, { status: 500 })
  }
}
