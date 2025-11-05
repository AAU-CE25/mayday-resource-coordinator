export async function GET() {
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${BACKEND_URL}/volunteers`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Error fetching volunteers:", error)
    console.log("[v0] Using mock data - ensure BACKEND_URL is set and backend is running")

    return Response.json([
      {
        id: "1",
        name: "Sarah Johnson",
        email: "sarah.j@email.com",
        phone: "+1-555-0101",
        skills: ["First Aid", "Search & Rescue"],
        status: "available",
        location: "North District",
      },
      {
        id: "2",
        name: "Mike Chen",
        email: "mike.chen@email.com",
        phone: "+1-555-0102",
        skills: ["Medical", "Logistics"],
        status: "assigned",
        assignedEvent: "1",
      },
      {
        id: "3",
        name: "Emily Rodriguez",
        email: "emily.r@email.com",
        phone: "+1-555-0103",
        skills: ["Communications", "Translation"],
        status: "available",
        location: "South District",
      },
      {
        id: "4",
        name: "David Kim",
        email: "david.kim@email.com",
        phone: "+1-555-0104",
        skills: ["Heavy Equipment", "Construction"],
        status: "unavailable",
      },
    ])
  }
}

export async function POST(request: Request) {
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

  try {
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/volunteers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Error registering volunteer:", error)
    return Response.json({ error: "Failed to register volunteer" }, { status: 500 })
  }
}
