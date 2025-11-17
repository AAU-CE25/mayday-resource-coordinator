/**
 * API client for fetching data from backend
 * Base URL: http://localhost:8000
 */

import type { Volunteer } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // Always fetch fresh data
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error)
    throw error
  }
}

/**
 * Fetch all events from backend
 */
export async function fetchEvents() {
  return apiFetch<Array<{
    id: number
    description: string
    priority: number
    status: string
    create_time: string
    modified_time: string
    location: {
      id: number
      address?: {
        street?: string | null
        city?: string | null
        postcode?: string | null
        country?: string | null
      } | null
      latitude?: number | null
      longitude?: number | null
    }
  }>>("/events")
}

/**
 * Fetch active volunteers for a specific event
 */
export async function fetchActiveVolunteers(eventId: number): Promise<Volunteer[]> {
  return apiFetch<Volunteer[]>(`/volunteers/active?event_id=${eventId}`)
}

/**
 * Create a new volunteer assignment (user joining an event)
 */
export async function createVolunteer(userId: number, eventId: number): Promise<Volunteer> {
  return apiFetch<Volunteer>("/volunteers/", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      event_id: eventId,
      status: "active",
    }),
  })
}

/**
 * Mark volunteer as completed (user leaving an event)
 */
export async function completeVolunteer(volunteerId: number): Promise<Volunteer> {
  return apiFetch<Volunteer>(`/volunteers/${volunteerId}`, {
    method: "PUT",
    body: JSON.stringify({
      id: volunteerId,
      status: "completed",
    }),
  })
}
