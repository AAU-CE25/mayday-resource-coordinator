"use client"

import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useActivity() {
  return useSWR("/api/activity", fetcher, {
    refreshInterval: 5000, // Refresh activity feed every 5 seconds
  })
}
