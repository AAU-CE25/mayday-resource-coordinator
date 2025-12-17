/**
 * Hook for resource-related API operations
 * Handles creating, updating, fetching, and deleting resources
 */

import { useState, useCallback } from "react"
import { get, post, put, del } from "@/lib/api-client"
import type { ResourceAvailable, ResourceNeeded } from "@/lib/types"

interface UseResourcesReturn {
  fetchVolunteerResources: (volunteerId: number) => Promise<ResourceAvailable[]>
  fetchResourcesNeededForEvent: (eventId: number) => Promise<ResourceNeeded[]>
  fetchResourcesAvailableForEvent: (eventId: number) => Promise<ResourceAvailable[]>
  createResource: (data: {
    name: string
    resource_type: string
    quantity: number
    description: string
    status: string
    volunteer_id: number
  }) => Promise<ResourceAvailable>
  updateResource: (resourceId: number, data: Partial<{
    name: string
    resource_type: string
    quantity: number
    description: string
    status: string
    event_id: number | null
    volunteer_id: number
  }>) => Promise<ResourceAvailable>
  deleteResource: (resourceId: number) => Promise<void>
  isLoading: boolean
  error: Error | null
}

/**
 * Hook for managing resources
 */
export function useResources(): UseResourcesReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchVolunteerResources = useCallback(async (volunteerId: number): Promise<ResourceAvailable[]> => {
    try {
      setIsLoading(true)
      setError(null)
      const allResources = await get<ResourceAvailable[]>('/resources/available/')
      return allResources.filter(r => r.volunteer_id === volunteerId)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch volunteer resources")
      setError(error)
      console.error('Failed to fetch resources:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchResourcesNeededForEvent = useCallback(async (eventId: number): Promise<ResourceNeeded[]> => {
    try {
      setIsLoading(true)
      setError(null)
      const resources = await get<ResourceNeeded[]>('/resources/needed/')
      return resources.filter((resource) => resource.event_id === eventId)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch needed resources")
      setError(error)
      console.error('Failed to fetch needed resources:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchResourcesAvailableForEvent = useCallback(async (eventId: number): Promise<ResourceAvailable[]> => {
    try {
      setIsLoading(true)
      setError(null)
      const resources = await get<ResourceAvailable[]>('/resources/available/')
      return resources.filter((resource) => resource.event_id === eventId)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch available resources")
      setError(error)
      console.error('Failed to fetch available resources:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createResource = useCallback(async (data: {
    name: string
    resource_type: string
    quantity: number
    description: string
    status: string
    volunteer_id: number
  }): Promise<ResourceAvailable> => {
    try {
      setIsLoading(true)
      setError(null)
      return await post<ResourceAvailable>('/resources/available/', {
        ...data,
        is_allocated: false
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to create resource")
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateResource = useCallback(async (resourceId: number, data: Partial<{
    name: string
    resource_type: string
    quantity: number
    description: string
    status: string
    event_id: number | null
    volunteer_id: number
  }>): Promise<ResourceAvailable> => {
    try {
      setIsLoading(true)
      setError(null)
      return await put<ResourceAvailable>(`/resources/available/${resourceId}`, data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to update resource")
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteResource = useCallback(async (resourceId: number): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)
      return await del<void>(`/resources/available/${resourceId}`)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to delete resource")
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    fetchVolunteerResources,
    fetchResourcesNeededForEvent,
    fetchResourcesAvailableForEvent,
    createResource,
    updateResource,
    deleteResource,
    isLoading,
    error,
  }
}
