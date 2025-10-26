"use client"

import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useEvents() {
  return useSWR("/api/event", fetcher, {
    refreshInterval: 5000, // Refresh every 5 seconds for real-time updates
  })
}
