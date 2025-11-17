/**
 * API client for fetching data from backend
 * Base URL: http://localhost:8000
 */

import type { Volunteer, User, AuthTokenResponse, LoginCredentials, RegisterData } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

/**
 * Get auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token')
  }
  return null
}

/**
 * Set auth token in localStorage
 */
export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token)
  }
}

/**
 * Clear auth token from localStorage
 */
export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token')
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const token = getAuthToken()
  
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
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

// ============= Auth API Functions =============

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthTokenResponse> {
  const response = await apiFetch<AuthTokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  })
  
  // Store the token
  setAuthToken(response.access_token)
  
  return response
}

/**
 * Register a new user
 */
export async function register(data: RegisterData): Promise<User> {
  return apiFetch<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User> {
  return apiFetch<User>('/auth/me')
}

/**
 * Logout (clear token)
 */
export function logout() {
  clearAuthToken()
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
 * Fetch all volunteers for a specific user
 */
export async function fetchUserVolunteers(userId: number): Promise<Volunteer[]> {
  return apiFetch<Volunteer[]>(`/volunteers/active?user_id=${userId}`)
}

/**
 * Fetch all volunteers (active and completed) for a specific user
 * This allows calculating total events attended
 */
export async function fetchAllUserVolunteers(userId: number): Promise<Volunteer[]> {
  // Try to fetch from general volunteers endpoint
  // If backend doesn't support this, we'll fallback to active only
  try {
    return apiFetch<Volunteer[]>(`/volunteers/?skip=0&limit=1000`)
      .then(volunteers => volunteers.filter(v => v.user.id === userId))
  } catch (error) {
    console.warn("Falling back to active volunteers only:", error)
    return fetchUserVolunteers(userId)
  }
}

/**
 * Fetch volunteers by user and event
 */
export async function fetchUserEventVolunteers(userId: number, eventId: number): Promise<Volunteer[]> {
  return apiFetch<Volunteer[]>(`/volunteers/active?user_id=${userId}&event_id=${eventId}`)
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
