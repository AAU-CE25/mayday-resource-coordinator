"use client"

import { useState } from "react"
import type { Event, Volunteer } from "@/lib/types"
import { createVolunteer } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

interface EventDetailsDialogProps {
  event: Event
  volunteers: Volunteer[]
  onClose: () => void
  onVolunteerJoined: () => void
  userHasActiveEvent?: boolean
  activeEventDescription?: string
}

/**
 * Event details dialog component
 * Shows event information and allows user to join as volunteer
 */
export function EventDetailsDialog({ 
  event, 
  volunteers, 
  onClose, 
  onVolunteerJoined,
  userHasActiveEvent = false,
  activeEventDescription = ""
}: EventDetailsDialogProps) {
  const { user } = useAuth()
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-DK", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPriorityLabel = (priority: number) => {
    if (priority === 1) return { text: "Critical", color: "text-red-600 bg-red-100" }
    if (priority === 2) return { text: "High", color: "text-orange-600 bg-orange-100" }
    if (priority === 3) return { text: "Medium", color: "text-yellow-600 bg-yellow-100" }
    return { text: "Low", color: "text-blue-600 bg-blue-100" }
  }

  const handleJoinEvent = async () => {
    if (!user) {
      setError("You must be logged in to join an event")
      return
    }

    setIsJoining(true)
    setError(null)

    try {
      await createVolunteer(user.id, event.id)
      onVolunteerJoined()
      onClose() // Close dialog after joining so the app can navigate to My Event tab
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join event")
    } finally {
      setIsJoining(false)
    }
  }

  const priorityInfo = getPriorityLabel(event.priority)
  const locationParts = []
  if (event.location.address?.street) locationParts.push(event.location.address.street)
  if (event.location.address?.city) locationParts.push(event.location.address.city)
  if (event.location.address?.postcode) locationParts.push(event.location.address.postcode)
  const fullLocation = locationParts.join(", ") || "Location not specified"

  return (
    <div className="fixed inset-0 bg-gray-50 bg-opacity-95 z-10 flex items-end sm:items-center sm:justify-center backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Event Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Description */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.description}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityInfo.color}`}>
                {priorityInfo.text} Priority
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 capitalize">
                {event.status}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p className="font-medium text-gray-900 text-sm">Location</p>
                <p className="text-gray-700 text-sm mt-1">{fullLocation}</p>
                {event.location.latitude && event.location.longitude && (
                  <p className="text-gray-500 text-xs mt-1">
                    {event.location.latitude.toFixed(4)}, {event.location.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Created:</span>
              <span className="text-gray-700">{formatDate(event.create_time)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Last Updated:</span>
              <span className="text-gray-700">{formatDate(event.modified_time)}</span>
            </div>
          </div>

          {/* Active Volunteers */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h4 className="font-semibold text-gray-900">
                Active Volunteers ({volunteers.length})
              </h4>
            </div>
            {volunteers.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {volunteers.map((volunteer) => (
                  <div key={volunteer.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{volunteer.user.name}</p>
                      <p className="text-gray-600 text-xs">{volunteer.user.email}</p>
                    </div>
                    <span className="text-green-600 text-xs font-medium">Active</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No active volunteers yet. Be the first!</p>
            )}
          </div>

          {/* Join Event Section */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">Declare Your Readiness</h4>
            {user ? (
              <div className="space-y-3">
                {userHasActiveEvent ? (
                  /* User already has an active event - show warning */
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-semibold text-amber-900 text-sm mb-1">Already Volunteering</p>
                        <p className="text-amber-800 text-sm">
                          You are currently assigned to another event: <span className="font-medium">{activeEventDescription}</span>
                        </p>
                        <p className="text-amber-700 text-xs mt-2">
                          You must leave your current event before joining a new one.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="w-full bg-amber-100 hover:bg-amber-200 text-amber-900 py-2 rounded-lg font-medium transition-colors"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  /* User can join - show normal flow */
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-900 font-medium mb-1">Joining as:</p>
                      <p className="text-blue-800 font-semibold">{user.name}</p>
                      <p className="text-blue-700 text-sm">{user.email}</p>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                        {error}
                      </div>
                    )}

                    <button
                      onClick={handleJoinEvent}
                      disabled={isJoining}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isJoining ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Joining...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Join as Volunteer</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-yellow-800 mb-3">You must be logged in to join this event</p>
                <button
                  onClick={onClose}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
