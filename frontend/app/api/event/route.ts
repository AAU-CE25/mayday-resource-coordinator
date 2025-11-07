export async function GET() {
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(`${BACKEND_URL}/event`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Error fetching events:", error)
    console.log("[v0] Using mock data - ensure BACKEND_URL is set and backend is running")

    return Response.json([
      {
        id: "1",
        description: "Flood emergency in residential area",
        priority: 1,
        status: "active",
        location: {
          region: "North District",
          address: "123 Main Street",
          postcode: "12345",
          latitude: 40.7128,
          longitude: -74.006,
        },
        resources_needed: [
          {
            name: "Ambulance",
            resource_type: "vehicle",
            description: "Emergency medical vehicle",
            quantity: 2,
            is_fulfilled: false,
          },
          {
            name: "Rescue Boat",
            resource_type: "vehicle",
            description: "Water rescue equipment",
            quantity: 3,
            is_fulfilled: true,
          },
        ],
      },
      {
        id: "2",
        description: "Building fire - multiple casualties",
        priority: 1,
        status: "active",
        location: {
          region: "South District",
          address: "456 Oak Avenue",
          postcode: "54321",
          latitude: 40.758,
          longitude: -73.9855,
        },
        resources_needed: [
          {
            name: "Fire Truck",
            resource_type: "vehicle",
            description: "Fire suppression and rescue",
            quantity: 4,
            is_fulfilled: false,
          },
          {
            name: "Medical Supplies",
            resource_type: "medical",
            description: "First aid and trauma supplies",
            quantity: 10,
            is_fulfilled: false,
          },
        ],
      },
      {
        id: "3",
        description: "Missing person - elderly with dementia",
        priority: 2,
        status: "active",
        location: {
          region: "East District",
          address: "789 Pine Road",
          postcode: "67890",
          latitude: 40.7489,
          longitude: -73.968,
        },
        resources_needed: [
          {
            name: "Search Dog",
            resource_type: "personnel",
            description: "Trained search and rescue dog",
            quantity: 2,
            is_fulfilled: true,
          },
        ],
      },
    ])
  }
}

export async function POST(request: Request) {
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

  try {
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Error creating event:", error)
    return Response.json({ error: "Failed to create event" }, { status: 500 })
  }
}
