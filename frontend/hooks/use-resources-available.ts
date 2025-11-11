'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export function useResourcesAvailable() {
  return useQuery({
    queryKey: ['resources/available'],
    queryFn: () => api.get('/resources/available/'),
    refetchInterval: 3000
  })
}