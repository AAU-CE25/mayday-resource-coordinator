/**
 * Hook for event-related API operations
 * Handles fetching events
 */

import { useState, useCallback } from "react"
import { get } from "@/lib/api-client"
import type { Event } from "@/lib/types"

interface UseEventsReturn {
  fetchEvents: () => Promise<Event[]>
  isLoading: boolean
  error: Error | null
}

/**
 * Hook for managing events
 */
export function useEvents(): UseEventsReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchEvents = useCallback(async (): Promise<Event[]> => {
    try {
      setIsLoading(true)
      setError(null)
      return await get<Array<{
        id: number
        description: string
        priority: number
        status: string
        create_time: string
        modified_time: string
        location: {
          id: number
          address?: {
            street?: string | null
            city?: string | null
            postcode?: string | null
            country?: string | null
          } | null
          latitude?: number | null
          longitude?: number | null
        }
      }>>("/events")
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch events")
      setError(error)
      console.error('Failed to fetch events:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    fetchEvents,
    isLoading,
    error,
  }
}
