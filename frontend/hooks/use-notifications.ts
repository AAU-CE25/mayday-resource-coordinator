"use client"

import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useNotifications() {
  return useSWR("/api/notifications", fetcher, {
    refreshInterval: 3000, // Check for new notifications every 3 seconds
  })
}
