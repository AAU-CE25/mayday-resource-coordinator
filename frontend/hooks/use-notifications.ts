"use client"
import { useEffect, useState } from "react"
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

const STORAGE_KEY = "notification_read_ids"

// Get read notification IDs from localStorage
const getReadIds = (): Set<number> => {
  if (typeof window === "undefined") return new Set()
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return new Set(stored ? JSON.parse(stored) : [])
  } catch {
    return new Set()
  }
}

// Save read notification IDs to localStorage
const saveReadIds = (ids: Set<number>) => {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)))
}

/**
 * useNotifications
 * - Uses /events/ as the source of "notifications"
 * - Keeps data realtime by opening a websocket to `${WS_BASE}/ws/events`
 * - Filters out read notifications (stored in localStorage)
 * - Maps event -> notification shape expected by UI
 */
export function useNotifications() {
  const key = "/events/" // SWR key; mutate this to revalidate
  const { data: events, error, mutate } = useSWR(key, () => fetcher(key), {
    revalidateOnFocus: true,
    refreshInterval: 15000,
  })

  const [readIds, setReadIds] = useState<Set<number>>(new Set())

  // Initialize read IDs from localStorage on mount
  useEffect(() => {
    setReadIds(getReadIds())
  }, [])

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
      console.debug("WS /ws/events connected")
    }

    ws.onmessage = (evt) => {
      try {
        const payload = JSON.parse(evt.data)
        mutate()
        globalMutate(key)
      } catch (e) {
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
  }, [WS_BASE, mutate])

  // map events -> notification-like objects and filter out read ones
  const notifications = (events ?? [])
    .filter((ev: any) => !readIds.has(ev.id)) // only show unread
    .map((ev: any) => ({
      id: ev.id,
      title: ev.description?.split("\n")[0] ?? `Event #${ev.id}`,
      message: `Priority ${ev.priority} • ${ev.status}`,
      timestamp: ev.create_time ?? ev.modified_time ?? ev.created_at ?? "",
      read: false,
      raw: ev,
    }))

  // Compute unread count (updates whenever readIds or events change)
  const unreadCount = Math.max(0, (events ?? []).length - readIds.size)

  // Mark single notification as read
  const markAsRead = (notificationId: number) => {
    const updated = new Set(readIds)
    updated.add(notificationId)
    setReadIds(updated)
    saveReadIds(updated)
  }

  // Mark all notifications as read
  const markAllAsRead = () => {
    const allIds = new Set<number>(
      (events ?? []).map((ev: any) => ev.id as number)
    )
    setReadIds(allIds)
    saveReadIds(allIds)
  }

  return {
    data: notifications,
    rawEvents: events ?? [],
    isLoading: !error && !events,
    isError: !!error,
    mutate,
    key,
    markAsRead,
    markAllAsRead,
    unreadCount, // NEW: expose unread count
  }
}