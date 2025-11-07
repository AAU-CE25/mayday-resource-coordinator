export async function POST() {
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

  try {
    const response = await fetch(`${BACKEND_URL}/notifications/read-all`, {
      method: "POST",
    })

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Error marking all notifications as read:", error)
    return Response.json({ error: "Failed to mark all notifications as read" }, { status: 500 })
  }
}
