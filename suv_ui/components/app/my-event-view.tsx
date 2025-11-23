"use client"

import { useAuth } from "@/lib/auth-context"
import type { Event } from "@/lib/types"

interface MyEventViewProps {
  event: Event
  onLeaveEvent: () => void
}

/**
 * My Event view component
 * Shows the current event user is volunteering for with resources needed/available
 */
export function MyEventView({ event, onLeaveEvent }: MyEventViewProps) {
  const { user } = useAuth()

  // Fake data for resources (endpoints not ready yet)
  const resourcesNeeded = [
    { id: 1, type: "Medical Supplies", quantity: 50, unit: "units", priority: 1 },
    { id: 2, type: "Water", quantity: 100, unit: "liters", priority: 1 },
    { id: 3, type: "Food Packages", quantity: 75, unit: "packages", priority: 2 },
    { id: 4, type: "Blankets", quantity: 30, unit: "items", priority: 2 },
    { id: 5, type: "Flashlights", quantity: 20, unit: "items", priority: 3 },
  ]

  const resourcesAvailable = [
    { id: 1, type: "Water", quantity: 45, unit: "liters", user: "Supply Team A" },
    { id: 2, type: "Food Packages", quantity: 30, unit: "packages", user: "Supply Team B" },
    { id: 3, type: "Blankets", quantity: 15, unit: "items", user: user?.name || "You" },
  ]

  const getPriorityLabel = (priority: number) => {
    if (priority === 1) return { text: "Critical", color: "bg-red-100 text-red-700" }
    if (priority === 2) return { text: "High", color: "bg-orange-100 text-orange-700" }
    return { text: "Medium", color: "bg-yellow-100 text-yellow-700" }
  }

  const formatLocation = () => {
    const parts = []
    if (event.location.address?.street) parts.push(event.location.address.street)
    if (event.location.address?.city) parts.push(event.location.address.city)
    return parts.join(", ") || "Location not specified"
  }

  return (
    <div className="p-4 space-y-4">
      {/* Event Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4 shadow-md">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h2 className="text-lg font-bold mb-1">Active Assignment</h2>
            <p className="text-blue-100 text-sm">{formatLocation()}</p>
          </div>
          <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs font-medium">
            Priority {event.priority}
          </span>
        </div>
        <p className="text-white font-medium">{event.description}</p>
      </div>

      {/* Resources Needed Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="font-semibold text-gray-900">Resources Needed</h3>
        </div>
        <div className="space-y-2">
          {resourcesNeeded.map((resource) => {
            const priorityInfo = getPriorityLabel(resource.priority)
            return (
              <div key={resource.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{resource.type}</p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    {resource.quantity} {resource.unit} required
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${priorityInfo.color}`}>
                  {priorityInfo.text}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Resources Available Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-gray-900">Resources Available</h3>
        </div>
        <div className="space-y-2">
          {resourcesAvailable.map((resource) => (
            <div key={resource.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{resource.type}</p>
                <p className="text-gray-600 text-xs mt-0.5">
                  {resource.quantity} {resource.unit} • {resource.user}
                </p>
              </div>
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* Resource Gap Summary */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-medium text-amber-900 text-sm">Resource Status</p>
            <p className="text-amber-800 text-xs mt-1">
              3 of 5 critical resources partially fulfilled. More supplies needed.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Offer Resources</span>
        </button>
        
        <button
          onClick={onLeaveEvent}
          className="w-full bg-red-50 text-red-700 py-3 px-4 rounded-lg font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Leave Event</span>
        </button>
      </div>

      {/* Info Note */}
      <div className="text-center text-xs text-gray-500 pt-2">
        <p>Resource endpoints are in development</p>
        <p className="text-gray-400">Showing sample data for demonstration</p>
      </div>
    </div>
  )
}
