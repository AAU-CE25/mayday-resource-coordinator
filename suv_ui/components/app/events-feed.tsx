"use client"

import { useEffect, useState, useCallback } from "react"
import type { Event, Volunteer } from "@/lib/types"
import { useEvents, useVolunteers } from "@/hooks"
import { useAuth } from "@/lib/auth-context"
import { useActiveAssignment } from "@/hooks/use-active-assignment"
import { EventCard } from "./event-card"
import { EventDetailsDialog } from "./event-details-dialog"

/**
 * Events feed component
 * Fetches and displays list of events from the API
 */
interface EventsFeedProps {
  onVolunteerJoined?: () => void
}

export function EventsFeed({ onVolunteerJoined }: EventsFeedProps = {}) {
  const { user } = useAuth()
  const { activeEvent, volunteer } = useActiveAssignment(user)
  const { fetchEvents } = useEvents()
  const { fetchActiveVolunteers } = useVolunteers()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedEventVolunteers, setSelectedEventVolunteers] = useState<Volunteer[]>([])
  const [loadingVolunteers, setLoadingVolunteers] = useState(false)

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchEvents()
      
      // Filter only active events and sort by priority (1 = highest)
      const activeEvents = data
        .filter((event: Event) => event.status.toLowerCase() === 'active')
        .sort((a: Event, b: Event) => a.priority - b.priority)
      
      // Fetch volunteer counts for each event
      const eventsWithVolunteers = await Promise.all(
        activeEvents.map(async (event: Event) => {
          try {
            const volunteers = await fetchActiveVolunteers(event.id)
            return { ...event, activeVolunteers: volunteers.length }
          } catch (err) {
            console.error(`Failed to fetch volunteers for event ${event.id}:`, err)
            return { ...event, activeVolunteers: 0 }
          }
        })
      )
      
      setEvents(eventsWithVolunteers)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events")
      console.error("Error loading events:", err)
    } finally {
      setLoading(false)
    }
  }, [fetchEvents, fetchActiveVolunteers])

  useEffect(() => {
    loadEvents()
    
    // Refresh events every 30 seconds
    const interval = setInterval(loadEvents, 30000)
    return () => clearInterval(interval)
  }, [loadEvents])

  const handleEventClick = async (event: Event) => {
    setSelectedEvent(event)
    setLoadingVolunteers(true)
    
    try {
      const volunteers = await fetchActiveVolunteers(event.id)
      setSelectedEventVolunteers(volunteers)
    } catch (err) {
      console.error("Failed to fetch volunteers:", err)
      setSelectedEventVolunteers([])
    } finally {
      setLoadingVolunteers(false)
    }
  }

  const handleCloseDialog = () => {
    setSelectedEvent(null)
    setSelectedEventVolunteers([])
  }

  const handleVolunteerJoined = () => {
    // Reload volunteers and events to reflect the change
    if (selectedEvent) {
      handleEventClick(selectedEvent)
    }
    loadEvents()
    
    // Notify parent component that user joined an event
    if (onVolunteerJoined) {
      onVolunteerJoined()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-gray-600 text-sm">Loading events...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-medium text-red-900 text-sm">Error Loading Events</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-red-800 underline hover:text-red-900"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <svg
          className="w-16 h-16 text-gray-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="text-gray-600 text-center">No events at this time</p>
        <p className="text-gray-400 text-sm text-center mt-1">Check back soon for updates</p>
      </div>
    )
  }

  return (
    <>
      <div className="pb-4">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">{events.length}</span> active event{events.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="p-4 space-y-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} onClick={() => handleEventClick(event)} />
          ))}
        </div>
      </div>

      {/* Event Details Dialog */}
      {selectedEvent && !loadingVolunteers && (
        <EventDetailsDialog
          event={selectedEvent}
          volunteers={selectedEventVolunteers}
          onClose={handleCloseDialog}
          onVolunteerJoined={handleVolunteerJoined}
          userHasActiveEvent={!!activeEvent && !!volunteer}
          activeEventDescription={activeEvent?.description || ""}
        />
      )}
    </>
  )
}
