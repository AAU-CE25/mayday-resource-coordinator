export async function GET() {
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${BACKEND_URL}/resourceAvailable`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Error fetching resources:", error)
    console.log("[v0] Using mock data - ensure BACKEND_URL is set and backend is running")

    return Response.json({
      available: [
        {
          id: "1",
          name: "Ambulance",
          type: "vehicle",
          quantity: 5,
          location: "North Station",
          status: "available",
        },
        {
          id: "2",
          name: "Fire Truck",
          type: "vehicle",
          quantity: 3,
          location: "Central Station",
          status: "available",
        },
        {
          id: "3",
          name: "Medical Supplies",
          type: "medical",
          quantity: 50,
          location: "Hospital Warehouse",
          status: "available",
        },
        {
          id: "4",
          name: "Rescue Boat",
          type: "vehicle",
          quantity: 2,
          location: "Marina",
          status: "available",
        },
      ],
      needed: [
        {
          id: "5",
          name: "Search Dog",
          type: "personnel",
          quantity: 3,
          priority: "high",
          eventId: "3",
        },
        {
          id: "6",
          name: "Helicopter",
          type: "vehicle",
          quantity: 1,
          priority: "critical",
          eventId: "2",
        },
      ],
    })
  }
}

export async function POST(request: Request) {
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

  try {
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Error adding resource:", error)
    return Response.json({ error: "Failed to add resource" }, { status: 500 })
  }
}
