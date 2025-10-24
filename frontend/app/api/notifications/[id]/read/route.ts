import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {

  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

  try {
    const response = await fetch(`${BACKEND_URL}/notifications/${(await context.params).id}/read`, {
      method: "POST",
    })

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Error marking notification as read:", error)
    return Response.json({ error: "Failed to mark notification as read" }, { status: 500 })
  }
}
