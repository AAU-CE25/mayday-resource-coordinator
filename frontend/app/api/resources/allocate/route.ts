import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { resource_id, event_id, quantity } = body
    if (!resource_id || !event_id) {
      return NextResponse.json({ error: 'resource_id and event_id are required' }, { status: 400 })
    }
    const API_BASE = process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const resp = await fetch(`${API_BASE}/resources/available/${resource_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: Number(event_id), is_allocated: true })
    })
    if (!resp.ok) {
      const text = await resp.text()
      return NextResponse.json({ error: 'Backend update failed', detail: text }, { status: resp.status })
    }
    const data = await resp.json()
    return NextResponse.json({ success: true, resource: data })
  } catch (err: any) {
    return NextResponse.json({ error: 'Unexpected error', detail: err?.message }, { status: 500 })
  }
}
