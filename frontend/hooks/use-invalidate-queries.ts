'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

// Query keys as constants for consistency
export const QUERY_KEYS = {
  events: ['events'] as const,
  users: ['users'] as const,
  resourcesAvailable: ['resources/available'] as const,
  resourcesNeeded: ['resources/needed'] as const,
  stats: ['stats'] as const,
  activity: ['activity'] as const,
  notifications: ['notifications'] as const,
}

export function useInvalidateQueries() {
  const queryClient = useQueryClient()

  const invalidateEvents = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events })
  }, [queryClient])

  const invalidateUsers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users })
  }, [queryClient])

  const invalidateResources = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.resourcesAvailable })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.resourcesNeeded })
  }, [queryClient])

  const invalidateStats = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats })
  }, [queryClient])

  const invalidateActivity = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activity })
  }, [queryClient])

  const invalidateAll = useCallback(() => {
    invalidateEvents()
    invalidateUsers()
    invalidateResources()
    invalidateStats()
    invalidateActivity()
  }, [invalidateEvents, invalidateUsers, invalidateResources, invalidateStats, invalidateActivity])

  return {
    invalidateEvents,
    invalidateUsers,
    invalidateResources,
    invalidateStats,
    invalidateActivity,
    invalidateAll,
  }
}
