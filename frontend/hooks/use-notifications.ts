<<<<<<< HEAD
// NEW HOOK IMPLEMENTATION

'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export function useNotifications() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/notifications/'),
    refetchInterval: 5000
  })
=======
"use client"
import { useEffect } from "react"
import useSWR, { mutate as globalMutate } from "swr"

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "")
const WS_BASE =
  (process.env.NEXT_PUBLIC_API_WS_URL ||
    API_BASE.replace(/^http/, "ws")).replace(/\/$/, "")

const fetcher = (path: string) =>
  fetch(`${API_BASE}${path}`).then((res) => {
    if (!res.ok) throw new Error(res.statusText)
    return res.json()
  })

/**
 * useNotifications
 * - Uses /events/ as the source of "notifications"
 * - Keeps data realtime by opening a websocket to `${WS_BASE}/ws/events`
 * - Maps event -> notification shape expected by UI
 */
export function useNotifications() {
  const key = "/events/" // SWR key; mutate this to revalidate
  const { data: events, error, mutate } = useSWR(key, () => fetcher(key), {
    revalidateOnFocus: true,
    refreshInterval: 15000,
  })

  // realtime: open WS and trigger revalidation on incoming messages
  useEffect(() => {
    let ws: WebSocket | null = null
    try {
      ws = new WebSocket(`${WS_BASE}/ws/events`)
    } catch (e) {
      console.warn("WS connection failed", e)
      return
    }

    ws.onopen = () => {
      // no-op, but useful for debugging
      console.debug("WS /ws/events connected")
    }

    ws.onmessage = (evt) => {
      try {
        // payload may be the new event or a simple signal; revalidate list
        const payload = JSON.parse(evt.data)
        // Optionally you can optimistically prepend the new event to cache:
        // mutate((current: any[]) => [payload, ...(current ?? [])], false)
        // But here we revalidate from server to keep authoritative state:
        mutate()
        // Also update any global listeners keyed by the same key:
        globalMutate(key)
      } catch (e) {
        // if payload isn't JSON, just revalidate
        mutate()
      }
    }

    ws.onclose = () => {
      console.debug("WS /ws/events closed")
      ws = null
    }

    ws.onerror = (err) => {
      console.error("WS /ws/events error", err)
    }

    return () => {
      try {
        ws?.close()
      } catch {}
      ws = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [WS_BASE]) // only run once / when WS_BASE changes

  // map events -> notification-like objects for UI
  const notifications = (events ?? []).map((ev: any) => ({
    id: ev.id,
    title: ev.description?.split("\n")[0] ?? `Event #${ev.id}`,
    message: `Priority ${ev.priority} • ${ev.status}`,
    timestamp: ev.create_time ?? ev.modified_time ?? ev.created_at ?? "",
    raw: ev,
  }))

  return {
    data: notifications,
    rawEvents: events ?? [],
    isLoading: !error && !events,
    isError: !!error,
    mutate, // revalidate events
    key,
  }
>>>>>>> 45aac8c (notification system)
}