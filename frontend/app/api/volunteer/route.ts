export async function GET() {
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

  try {
    const response = await fetch(`${BACKEND_URL}/volunteer`)
    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Error fetching volunteers:", error)
    return Response.json([
      {
        id: "1",
        name: "John Doe",
        phone: "+1234567890",
        status: "available",
        skills: ["First Aid", "Search & Rescue"],
        location: {
          address: "Downtown Area",
          latitude: -12.8432905,
          longitude: 175.065665,
        },
      },
    ])
  }
}
