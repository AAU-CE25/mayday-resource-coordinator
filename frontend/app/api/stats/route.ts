export async function GET() {
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${BACKEND_URL}/stats`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Error fetching stats:", error)
    console.log("[v0] Using mock data - ensure BACKEND_URL is set and backend is running")

    return Response.json({
      activeEvents: 3,
      totalVolunteers: 4,
      resourcesAvailable: 60,
      totalLocations: 3,
    })
  }
}
