'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export function useVolunteers() {
  return useQuery({
    queryKey: ['volunteers'],
    queryFn: () => api.get('/volunteers/'),
    refetchInterval: 5000
  })
}