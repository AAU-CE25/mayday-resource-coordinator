"use client"

import { useEffect, useMemo, useState } from "react"
import type { Event, ResourceAvailable, ResourceNeeded } from "@/lib/types"
import {
  fetchResourcesAvailableForEvent,
  fetchResourcesNeededForEvent,
  fetchVolunteerResources,
  updateResource,
  fetchAllUserVolunteers,
} from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

interface MyEventViewProps {
  event: Event
  volunteerId: number
  onLeaveEvent: () => void
}

/**
 * My Event view component
 * Shows the current event user is volunteering for with resources needed/available
 */
export function MyEventView({ event, volunteerId, onLeaveEvent }: MyEventViewProps) {
  const { user } = useAuth()
  const [resourcesNeeded, setResourcesNeeded] = useState<ResourceNeeded[]>([])
  const [resourcesAvailable, setResourcesAvailable] = useState<ResourceAvailable[]>([])
  const [resourcesLoading, setResourcesLoading] = useState(true)
  const [resourcesError, setResourcesError] = useState<string | null>(null)
  const [volunteerResources, setVolunteerResources] = useState<ResourceAvailable[]>([])
  const [volunteerResourcesLoading, setVolunteerResourcesLoading] = useState(true)
  const [volunteerResourceOwnerIds, setVolunteerResourceOwnerIds] = useState<number[]>([])
  const [offerDialogOpen, setOfferDialogOpen] = useState(false)
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null)
  const [offerSubmitting, setOfferSubmitting] = useState(false)
  const [offerError, setOfferError] = useState<string | null>(null)

  const loadEventResources = async () => {
    setResourcesLoading(true)
    setResourcesError(null)

    try {
      const [needed, available] = await Promise.all([
        fetchResourcesNeededForEvent(event.id),
        fetchResourcesAvailableForEvent(event.id),
      ])

      setResourcesNeeded(needed)
      setResourcesAvailable(available)
    } catch (error) {
      console.error("Failed to load event resources:", error)
      setResourcesNeeded([])
      setResourcesAvailable([])
      setResourcesError("Unable to load resources for this event right now.")
    } finally {
      setResourcesLoading(false)
    }
  }

  const determineResourceOwnerIds = async () => {
    if (!user) {
      setVolunteerResourceOwnerIds([])
      return
    }
    try {
      const volunteerRecords = await fetchAllUserVolunteers(user.id)
      if (volunteerRecords.length > 0) {
        setVolunteerResourceOwnerIds(volunteerRecords.map((v) => v.id))
      } else if (volunteerId) {
        setVolunteerResourceOwnerIds([volunteerId])
      } else {
        setVolunteerResourceOwnerIds([])
      }
    } catch (error) {
      console.error("Failed to load volunteer records for resource ownership:", error)
      if (volunteerId) {
        setVolunteerResourceOwnerIds([volunteerId])
      } else {
        setVolunteerResourceOwnerIds([])
      }
    }
  }

  const loadVolunteerResources = async (ownerIds: number[]) => {
    if (!ownerIds.length) {
      setVolunteerResources([])
      setVolunteerResourcesLoading(false)
      return
    }
    setVolunteerResourcesLoading(true)
    try {
      const results = await Promise.all(ownerIds.map((id) => fetchVolunteerResources(id)))
      const combined = results.flat()
      const uniqueMap = new Map<number, ResourceAvailable>()
      combined.forEach((resource) => {
        uniqueMap.set(resource.id, resource)
      })
      setVolunteerResources(Array.from(uniqueMap.values()))
    } catch (error) {
      console.error("Failed to load volunteer resources:", error)
      setVolunteerResources([])
    } finally {
      setVolunteerResourcesLoading(false)
    }
  }

  useEffect(() => {
    loadEventResources()
  }, [event.id])

  useEffect(() => {
    void (async () => {
      await determineResourceOwnerIds()
    })()
  }, [user?.id, volunteerId])

  useEffect(() => {
    void loadVolunteerResources(volunteerResourceOwnerIds)
  }, [volunteerResourceOwnerIds])

  const resourceSummary = useMemo(() => {
    if (resourcesNeeded.length === 0) {
      return "No resource requests have been logged for this event yet."
    }

    const fulfilledCount = resourcesNeeded.filter((resource) => resource.is_fulfilled).length
    const outstandingQuantity = resourcesNeeded
      .filter((resource) => !resource.is_fulfilled)
      .reduce((sum, resource) => sum + resource.quantity, 0)

    if (fulfilledCount === resourcesNeeded.length) {
      return "All resource requests have been fulfilled for this event."
    }

    return `${fulfilledCount} of ${resourcesNeeded.length} requests fulfilled. ${outstandingQuantity} units still outstanding.`
  }, [resourcesNeeded])

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
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/80 text-blue-700">
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
        {resourcesLoading ? (
          <p className="text-sm text-gray-500">Loading resource needs...</p>
        ) : resourcesError ? (
          <p className="text-sm text-red-600">{resourcesError}</p>
        ) : resourcesNeeded.length === 0 ? (
          <p className="text-sm text-gray-500">
            No resource requests have been submitted for this event yet.
          </p>
        ) : (
          <div className="space-y-2">
            {resourcesNeeded.map((resource) => (
              <div key={resource.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{resource.name}</p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {resource.resource_type} • Qty: {resource.quantity}
                    </p>
                    {resource.description && (
                      <p className="text-gray-500 text-xs mt-1">{resource.description}</p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      resource.is_fulfilled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {resource.is_fulfilled ? "Fulfilled" : "Needed"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resources Available Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-gray-900">Resources Available</h3>
        </div>
        {resourcesLoading ? (
          <p className="text-sm text-gray-500">Loading available resources...</p>
        ) : resourcesAvailable.length === 0 ? (
          <p className="text-sm text-gray-500">No resources have been allocated to this event yet.</p>
        ) : (
          <div className="space-y-2">
            {resourcesAvailable.map((resource) => (
              <div key={resource.id} className="rounded-lg border border-green-100 bg-green-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{resource.name}</p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {resource.resource_type} • Qty: {resource.quantity}
                    </p>
                    {resource.description && (
                      <p className="text-gray-500 text-xs mt-1">{resource.description}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      {resource.volunteer_id
                        ? `Provided by volunteer #${resource.volunteer_id}`
                        : "Unassigned resource"}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      resource.is_allocated ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {resource.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resource Gap Summary */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-medium text-amber-900 text-sm">Resource Status</p>
            <p className="text-amber-800 text-xs mt-1">{resourceSummary}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          onClick={() => setOfferDialogOpen(true)}
          disabled={volunteerResourcesLoading || volunteerResources.length === 0}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>
            {volunteerResourcesLoading
              ? "Checking resources..."
              : volunteerResources.length > 0
                ? "Offer Resources"
                : "No Resources to Offer"}
          </span>
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

      {offerDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Offer Resource</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Choose one of your resources to assign to this event.
                </p>
              </div>
              <button
                onClick={() => {
                  setOfferDialogOpen(false)
                  setSelectedResourceId(null)
                  setOfferError(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {offerError && <p className="mt-3 text-sm text-red-600">{offerError}</p>}

            <div className="mt-4 space-y-3 max-h-56 overflow-y-auto pr-1">
              {volunteerResourcesLoading ? (
                <p className="text-sm text-gray-500">Loading your resources...</p>
              ) : volunteerResources.length === 0 ? (
                <p className="text-sm text-gray-500">
                  You haven't added any resources yet. Use the My Resources section in your profile to add them.
                </p>
              ) : (
                volunteerResources.map((resource) => {
                  const isAssignedElsewhere = resource.event_id && resource.event_id !== event.id
                  return (
                    <button
                      key={resource.id}
                      onClick={() => {
                        if (isAssignedElsewhere) return
                        setSelectedResourceId(resource.id)
                        setOfferError(null)
                      }}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        selectedResourceId === resource.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                      } ${isAssignedElsewhere ? "cursor-not-allowed opacity-50" : "hover:border-blue-300"}`}
                      disabled={isAssignedElsewhere || offerSubmitting}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{resource.name}</p>
                          <p className="text-xs text-gray-500">
                            {resource.resource_type} • Qty: {resource.quantity}
                          </p>
                          {resource.description && (
                            <p className="text-xs text-gray-400 mt-1">{resource.description}</p>
                          )}
                        </div>
                        {isAssignedElsewhere && (
                          <span className="text-xs font-medium text-red-600">Assigned elsewhere</span>
                        )}
                        {resource.event_id === event.id && (
                          <span className="text-xs font-medium text-green-600">Already offered</span>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setOfferDialogOpen(false)
                  setSelectedResourceId(null)
                  setOfferError(null)
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                disabled={offerSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedResourceId) {
                    setOfferError("Select a resource to offer")
                    return
                  }
                  setOfferSubmitting(true)
                  setOfferError(null)
                  try {
                    await updateResource(selectedResourceId, {
                      event_id: event.id,
                      status: "in_use",
                    })
                    await Promise.all([loadEventResources(), loadVolunteerResources(volunteerResourceOwnerIds)])
                    setOfferDialogOpen(false)
                    setSelectedResourceId(null)
                  } catch (error) {
                    console.error("Failed to offer resource:", error)
                    setOfferError("Unable to offer this resource right now.")
                  } finally {
                    setOfferSubmitting(false)
                  }
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={offerSubmitting || !selectedResourceId}
              >
                {offerSubmitting ? "Offering..." : "Offer Resource"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
