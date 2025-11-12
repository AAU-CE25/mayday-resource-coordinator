// NEW HOOK IMPLEMENTATION

'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export function useNotifications() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/notifications/'),
    refetchInterval: 5000
  })
}