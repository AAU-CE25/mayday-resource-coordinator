"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useVolunteerStats } from "@/hooks/use-volunteer-stats"
import { useEffect, useState } from "react"
import { fetchEvents } from "@/lib/api-client"
import type { Event } from "@/lib/types"

/**
 * Profile view component
 * Displays authenticated user information and volunteer statistics
 */
export function ProfileView() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const { stats, isLoading: statsLoading, error: statsError } = useVolunteerStats(user?.id)
  const [events, setEvents] = useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)

  // Fetch events for mapping descriptions
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setEventsLoading(true)
        const eventData = await fetchEvents()
        setEvents(eventData)
      } catch (error) {
        console.error("Failed to load events:", error)
      } finally {
        setEventsLoading(false)
      }
    }
    
    loadEvents()
  }, [])

  // Helper to get event description
  const getEventDescription = (eventId: number): string => {
    const event = events.find(e => e.id === eventId)
    return event?.description || `Event #${eventId}`
  }

  const handleLogout = () => {
    logout()
    router.push("/auth")
  }

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-gray-600 text-sm">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to view your profile</p>
          <button
            onClick={() => router.push("/auth")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-600">{user.role || "SUV Volunteer"}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
              <p className="text-sm text-gray-900">{user.email}</p>
            </div>
          </div>

          {user.phonenumber && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                <p className="text-sm text-gray-900">{user.phonenumber}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Activity Summary</h3>
        
        {statsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="inline-block w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : statsError ? (
          <div className="text-center py-4">
            <p className="text-sm text-red-600">Failed to load stats</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-blue-600">{stats.totalEvents}</p>
              <p className="text-sm text-gray-600 mt-1">Total Events</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-green-600">{stats.totalHours.toFixed(1)}h</p>
              <p className="text-sm text-gray-600 mt-1">Total Time</p>
            </div>
          </div>
        )}
      </div>

      {/* Volunteer History */}
      {!statsLoading && stats.volunteers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Volunteer History</h3>
          
          {eventsLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="inline-block w-5 h-5 border-3 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.volunteers
                .sort((a, b) => new Date(b.create_time).getTime() - new Date(a.create_time).getTime())
                .slice(0, 10)
                .map((volunteer) => {
                  const eventDesc = getEventDescription(volunteer.event_id)
                  return (
                    <div
                      key={volunteer.id}
                      className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {eventDesc}
                          </p>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              volunteer.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : volunteer.status === 'active'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {volunteer.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            Joined: {new Date(volunteer.create_time).toLocaleDateString()}
                          </span>
                          {volunteer.completion_time && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Completed: {new Date(volunteer.completion_time).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
          
          {stats.volunteers.length > 10 && (
            <p className="text-xs text-gray-500 mt-3 text-center">
              Showing 10 most recent of {stats.volunteers.length} total assignments
            </p>
          )}
        </div>
      )}

      {/* Account Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Account</h3>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  )
}
