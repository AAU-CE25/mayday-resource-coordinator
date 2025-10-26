"use client"

import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useStats() {
  return useSWR("/api/stats", fetcher, {
    refreshInterval: 3000, // More frequent updates for stats
  })
}
