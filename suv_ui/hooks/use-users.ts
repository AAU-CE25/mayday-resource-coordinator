/**
 * Hook for user-related API operations
 * Handles fetching and updating user records
 */

import { useState, useCallback } from "react"
import { get, put } from "@/lib/api-client"
import type { User } from "@/lib/types"

interface UseUsersReturn {
  fetchAllUsers: () => Promise<User[]>
  fetchActiveUsers: (eventId: number) => Promise<User[]>
  updateUser: (userId: number, data: Partial<{
    name: string
    email: string
    phonenumber: string
    status: string
  }>) => Promise<User>
  isLoading: boolean
  error: Error | null
}

/**
 * Hook for managing users
 */
export function useUsers(): UseUsersReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchAllUsers = useCallback(async (): Promise<User[]> => {
    try {
      setIsLoading(true)
      setError(null)
      return await get<User[]>('/users/')
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch users")
      setError(error)
      console.error('Failed to fetch users:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchActiveUsers = useCallback(async (eventId: number): Promise<User[]> => {
    try {
      setIsLoading(true)
      setError(null)
      return await get<User[]>(`/users/?event_id=${eventId}&status=active`)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch active users")
      setError(error)
      console.error('Failed to fetch users for event:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateUser = useCallback(async (userId: number, data: Partial<{
    name: string
    email: string
    phonenumber: string
    status: string
  }>): Promise<User> => {
    try {
      setIsLoading(true)
      setError(null)
      return await put<User>(`/users/${userId}`, data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to update user")
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    fetchAllUsers,
    fetchActiveUsers,
    updateUser,
    isLoading,
    error,
  }
}
