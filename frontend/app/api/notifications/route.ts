export async function GET() {
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

  try {
    const response = await fetch(`${BACKEND_URL}/notifications`)
    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Error fetching notifications:", error)
    return Response.json([])
  }
}
