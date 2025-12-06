'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export function useResourcesNeeded() {
  return useQuery({
    queryKey: ['resources/needed'],
    queryFn: () => api.get('/resources/needed/'),
    refetchInterval: 5000
  })
}