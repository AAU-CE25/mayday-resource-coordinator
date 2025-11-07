"use client"

import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useVolunteers() {
  return useSWR("/api/volunteers", fetcher, {
    refreshInterval: 5000,
  })
}
