"use client"

import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useNotifications() {
  return useSWR("/api/notifications", fetcher, {
    refreshInterval: 3000, // Check for new notifications every 3 seconds
  })
}


// NEW HOOK IMPLEMENTATION

// 'use client'

// import { useQuery } from '@tanstack/react-query'
// import { api } from '@/lib/api-client'

// export function useEvents() {
//   return useQuery({
//     queryKey: ['events'],
//     queryFn: () => api.get('/events/'),
//     refetchInterval: 5000
//   })
// }