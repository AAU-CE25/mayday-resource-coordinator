import { useState, useEffect, useCallback } from "react"
import { useVolunteers } from "./use-volunteers"
import type { Volunteer } from "@/lib/types"

/**
 * Calculate hours between two dates
 */
function calculateHours(startTime: string, endTime: string): number {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const diffMs = end.getTime() - start.getTime()
  return diffMs / (1000 * 60 * 60) // Convert milliseconds to hours
}

/**
 * Volunteer statistics interface
 */
export interface VolunteerStats {
  totalEvents: number
  activeEvents: number
  completedEvents: number
  cancelledEvents: number
  totalHours: number
  volunteers: Volunteer[]
}

/**
 * Hook return type
 */
interface UseVolunteerStatsReturn {
  stats: VolunteerStats
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

/**
 * Custom hook to fetch and calculate volunteer statistics for a user
 * 
 * @param userId - The user ID to fetch stats for
 * @param autoFetch - Whether to automatically fetch on mount (default: true)
 * @returns Volunteer statistics with loading/error states
 * 
 * @example
 * ```tsx
 * const { stats, isLoading, error, refresh } = useVolunteerStats(user.id)
 * 
 * if (isLoading) return <div>Loading...</div>
 * if (error) return <div>Error: {error.message}</div>
 * 
 * return (
 *   <div>
 *     <p>Total Events: {stats.totalEvents}</p>
 *     <p>Completed: {stats.completedEvents}</p>
 *     <p>Total Hours: {stats.totalHours.toFixed(1)}</p>
 *   </div>
 * )
 * ```
 */
export function useVolunteerStats(
  userId: number | null | undefined,
  autoFetch: boolean = true
): UseVolunteerStatsReturn {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [error, setError] = useState<Error | null>(null)
  
  const { fetchAllUserVolunteers } = useVolunteers()

  /**
   * Fetch volunteer data from API
   */
  const fetchStats = useCallback(async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const data = await fetchAllUserVolunteers(userId)
      setVolunteers(data)
    } catch (err) {
      console.error("Failed to fetch volunteer stats:", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch stats"))
      setVolunteers([])
    } finally {
      setIsLoading(false)
    }
  }, [userId, fetchAllUserVolunteers])

  /**
   * Auto-fetch on mount if enabled
   */
  useEffect(() => {
    if (autoFetch) {
      fetchStats()
    }
  }, [autoFetch, fetchStats])

  /**
   * Calculate statistics from volunteer data
   */
  const stats: VolunteerStats = {
    totalEvents: volunteers.length,
    activeEvents: volunteers.filter(v => v.status === 'active').length,
    completedEvents: volunteers.filter(v => v.status === 'completed').length,
    cancelledEvents: volunteers.filter(v => v.status === 'cancelled').length,
    totalHours: volunteers
      .filter(v => v.status === 'completed' && v.completion_time)
      .reduce((total, v) => total + calculateHours(v.create_time, v.completion_time!), 0),
    volunteers,
  }

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats,
  }
}
