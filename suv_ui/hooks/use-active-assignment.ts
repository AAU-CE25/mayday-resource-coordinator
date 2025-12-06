/**
 * Hook to check and manage user's active volunteer assignment
 * Extracts complex business logic from page component
 */

import { useState, useEffect, useCallback } from "react"
import type { Event, Volunteer, User } from "@/lib/types"
import { fetchEvents, fetchActiveVolunteers, completeVolunteer } from "@/lib/api-client"

interface ActiveAssignment {
  event: Event | null
  volunteerId: number | null
}

interface UseActiveAssignmentReturn {
  activeEvent: Event | null
  volunteerId: number | null
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
  leaveEvent: () => Promise<void>
}

/**
 * Custom hook to manage user's active volunteer assignment
 * Checks if user is currently volunteering at any event
 */
export function useActiveAssignment(user: User | null): UseActiveAssignmentReturn {
  const [assignment, setAssignment] = useState<ActiveAssignment>({
    event: null,
    volunteerId: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const checkActiveAssignment = useCallback(async () => {
    if (!user) {
      setAssignment({ event: null, volunteerId: null })
      setLoading(false)
      return
    }

    try {
      setError(null)
      setLoading(true)

      // Fetch all events to check which one the user is volunteering for
      const events = await fetchEvents()

      // Check each event for the user's active volunteer status
      for (const event of events) {
        try {
          const volunteers = await fetchActiveVolunteers(event.id)
          const myVolunteer = volunteers.find(
            (v: Volunteer) => v.user?.id === user.id && v.status === "active"
          )

          if (myVolunteer) {
            setAssignment({
              event,
              volunteerId: myVolunteer.id,
            })
            return
          }
        } catch (err) {
          // Continue checking other events if one fails
          console.warn(`Failed to fetch volunteers for event ${event.id}:`, err)
        }
      }

      // No active event found
      setAssignment({ event: null, volunteerId: null })
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to check active assignment")
      setError(error)
      console.error("Failed to check active assignment:", error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const leaveEvent = useCallback(async () => {
    if (!assignment.volunteerId) {
      throw new Error("No active volunteer assignment to leave")
    }

    try {
      await completeVolunteer(assignment.volunteerId)
      setAssignment({ event: null, volunteerId: null })
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to leave event")
      setError(error)
      throw error
    }
  }, [assignment.volunteerId])

  // Check assignment when user changes
  useEffect(() => {
    void checkActiveAssignment()
  }, [checkActiveAssignment])

  return {
    activeEvent: assignment.event,
    volunteerId: assignment.volunteerId,
    loading,
    error,
    refresh: checkActiveAssignment,
    leaveEvent,
  }
}
