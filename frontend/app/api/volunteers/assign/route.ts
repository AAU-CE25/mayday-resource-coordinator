export async function POST(request: Request) {
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

  try {
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/volunteers/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Error assigning volunteer:", error)
    return Response.json({ error: "Failed to assign volunteer" }, { status: 500 })
  }
}
