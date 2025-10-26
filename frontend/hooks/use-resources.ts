"use client"

import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useResources() {
  return useSWR("/api/resources", fetcher, {
    refreshInterval: 5000,
  })
}
