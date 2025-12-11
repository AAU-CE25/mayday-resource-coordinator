/**
 * Hook for volunteer-related API operations
 * Handles creating, updating, and fetching volunteer assignments
 */

import { useState, useCallback } from "react"
import { get, post, put } from "@/lib/api-client"
import type { Volunteer } from "@/lib/types"

interface UseVolunteersReturn {
  fetchActiveVolunteers: (eventId: number) => Promise<Volunteer[]>
  fetchUserVolunteers: (userId: number) => Promise<Volunteer[]>
  fetchAllUserVolunteers: (userId: number, status?: string) => Promise<Volunteer[]>
  fetchUserEventVolunteers: (userId: number, eventId: number) => Promise<Volunteer[]>
  fetchAllVolunteers: () => Promise<Volunteer[]>
  createVolunteer: (userId: number, eventId: number) => Promise<Volunteer>
  completeVolunteer: (volunteerId: number) => Promise<Volunteer>
  updateVolunteerStatus: (volunteerId: number, status: string) => Promise<Volunteer>
  getUserVolunteerProfile: (userId: number) => Promise<Volunteer | null>
  isLoading: boolean
  error: Error | null
}

/**
 * Hook for managing volunteers
 */
export function useVolunteers(): UseVolunteersReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchActiveVolunteers = useCallback(async (eventId: number): Promise<Volunteer[]> => {
    try {
      setIsLoading(true)
      setError(null)
      return await get<Volunteer[]>(`/volunteers/?event_id=${eventId}&status=active`)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch active volunteers")
      setError(error)
      console.error('Failed to fetch active volunteers:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchUserVolunteers = useCallback(async (userId: number): Promise<Volunteer[]> => {
    try {
      setIsLoading(true)
      setError(null)
      return await get<Volunteer[]>(`/volunteers/?user_id=${userId}&status=active`)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch user volunteers")
      setError(error)
      console.error('Failed to fetch user volunteers:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchAllUserVolunteers = useCallback(async (userId: number, status?: string): Promise<Volunteer[]> => {
    try {
      setIsLoading(true)
      setError(null)
      const params = new URLSearchParams({
        user_id: userId.toString(),
        skip: '0',
        limit: '1000'
      })
      
      if (status) {
        params.append('status', status)
      }
      
      return await get<Volunteer[]>(`/volunteers/?${params.toString()}`)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch all user volunteers")
      setError(error)
      console.error('Failed to fetch all user volunteers:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchUserEventVolunteers = useCallback(async (userId: number, eventId: number): Promise<Volunteer[]> => {
    try {
      setIsLoading(true)
      setError(null)
      return await get<Volunteer[]>(`/volunteers/?user_id=${userId}&event_id=${eventId}&status=active`)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch user event volunteers")
      setError(error)
      console.error('Failed to fetch user event volunteers:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchAllVolunteers = useCallback(async (): Promise<Volunteer[]> => {
    try {
      setIsLoading(true)
      setError(null)
      return await get<Volunteer[]>('/volunteers/')
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch volunteers")
      setError(error)
      console.error('Failed to fetch volunteers:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createVolunteer = useCallback(async (userId: number, eventId: number): Promise<Volunteer> => {
    try {
      setIsLoading(true)
      setError(null)
      return await post<Volunteer>("/volunteers/", {
        user_id: userId,
        event_id: eventId,
        status: "active",
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to create volunteer")
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const completeVolunteer = useCallback(async (volunteerId: number): Promise<Volunteer> => {
    try {
      setIsLoading(true)
      setError(null)
      return await put<Volunteer>(`/volunteers/${volunteerId}`, {
        id: volunteerId,
        status: "completed",
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to complete volunteer")
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateVolunteerStatus = useCallback(async (volunteerId: number, status: string): Promise<Volunteer> => {
    try {
      setIsLoading(true)
      setError(null)
      return await put<Volunteer>(`/volunteers/${volunteerId}`, {
        id: volunteerId,
        status: status,
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to update volunteer status")
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getUserVolunteerProfile = useCallback(async (userId: number): Promise<Volunteer | null> => {
    try {
      setIsLoading(true)
      setError(null)
      const volunteers = await get<Volunteer[]>(`/volunteers/?user_id=${userId}&limit=1`)
      return volunteers && volunteers.length > 0 ? volunteers[0] : null
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch volunteer profile")
      setError(error)
      console.error('Failed to fetch volunteer profile:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    fetchActiveVolunteers,
    fetchUserVolunteers,
    fetchAllUserVolunteers,
    fetchUserEventVolunteers,
    fetchAllVolunteers,
    createVolunteer,
    completeVolunteer,
    updateVolunteerStatus,
    getUserVolunteerProfile,
    isLoading,
    error,
  }
}
