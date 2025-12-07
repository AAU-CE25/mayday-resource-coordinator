/**
 * API client for fetching data from backend
 * Base URL must be configured via NEXT_PUBLIC_API_URL environment variable
 */

import type { Volunteer, User, AuthTokenResponse, LoginCredentials, RegisterData, ResourceAvailable, ResourceNeeded } from "./types"

// Get API URL from environment variable - throws if not configured
function getApiBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  
  if (!apiUrl) {
    throw new Error(
      'NEXT_PUBLIC_API_URL environment variable is not set. ' +
      'Please configure it in your .env file or build arguments.'
    )
  }
  
  // Validate that URL includes protocol
  if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
    throw new Error(
      `NEXT_PUBLIC_API_URL must include protocol (http:// or https://). Got: ${apiUrl}`
    )
  }
  
  // Remove trailing slash to prevent double slashes
  const cleanUrl = apiUrl.replace(/\/+$/, '')
  
  console.log('API Base URL:', cleanUrl)
  return cleanUrl
}
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)

/**
 * Get auth token from sessionStorage (expires when browser closes - more secure)
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('auth_token')
  }
  return null
}

/**
 * Set auth token in sessionStorage
 */
export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('auth_token', token)
  }
}

/**
 * Clear auth token from sessionStorage
 */
export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('auth_token')
  }
}

/**
 * Generic fetch wrapper with error handling and auto-logout on 401
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${getApiBaseUrl()}${path}`
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

    // Handle unauthorized - clear token and redirect
    if (response.status === 401) {
      clearAuthToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new Error('Session expired. Please login again.')
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`API error ${response.status}: ${errorText}`)
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204 || response.headers.get("content-length") === "0") {
      return {} as T
    }

    return response.json()
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error)
    throw error
  }
}

// ============= Generic HTTP Methods =============

/**
 * Generic GET request
 */
export async function get<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, { method: 'GET' })
}

/**
 * Generic POST request
 */
export async function post<T>(endpoint: string, data?: unknown): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * Generic PUT request
 */
export async function put<T>(endpoint: string, data?: unknown): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * Generic PATCH request
 */
export async function patch<T>(endpoint: string, data?: unknown): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * Generic DELETE request
 */
export async function del<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, { method: 'DELETE' })
}

// ============= Auth API Functions =============

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthTokenResponse> {
  const response = await post<AuthTokenResponse>('/auth/login', credentials)
  
  // Store the token
  setAuthToken(response.access_token)
  
  return response
}

/**
 * Register a new user
 */
export async function register(data: RegisterData): Promise<User> {
  // Create user account 
  const user = await post<User>('/auth/register', data)
  return user
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User> {
  return get<User>('/auth/me')
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
  return get<Array<{
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
  return get<Volunteer[]>(`/volunteers/?event_id=${eventId}&status=active`)
}

/**
 * Fetch active volunteers for a specific user
 */
export async function fetchUserVolunteers(userId: number): Promise<Volunteer[]> {
  return get<Volunteer[]>(`/volunteers/?user_id=${userId}&status=active`)
}

/**
 * Fetch all volunteers (active and completed) for a specific user
 * Uses backend filtering for better performance
 */
export async function fetchAllUserVolunteers(userId: number, status?: string): Promise<Volunteer[]> {
  const params = new URLSearchParams({
    user_id: userId.toString(),
    skip: '0',
    limit: '1000'
  })
  
  if (status) {
    params.append('status', status)
  }
  
  return get<Volunteer[]>(`/volunteers/?${params.toString()}`)
}

/**
 * Fetch active volunteers by user and event
 */
export async function fetchUserEventVolunteers(userId: number, eventId: number): Promise<Volunteer[]> {
  return get<Volunteer[]>(`/volunteers/?user_id=${userId}&event_id=${eventId}&status=active`)
}

/**
 * Create a new volunteer assignment (user joining an event)
 */
export async function createVolunteer(userId: number, eventId: number): Promise<Volunteer> {
  return post<Volunteer>("/volunteers/", {
    user_id: userId,
    event_id: eventId,
    status: "active",
  })
}

/**
 * Mark volunteer as completed (user leaving an event)
 */
export async function completeVolunteer(volunteerId: number): Promise<Volunteer> {
  return put<Volunteer>(`/volunteers/${volunteerId}`, {
    id: volunteerId,
    status: "completed",
  })
}

/**
 * Update volunteer availability status (available/unavailable)
 */
export async function updateVolunteerStatus(volunteerId: number, status: string): Promise<Volunteer> {
  return put<Volunteer>(`/volunteers/${volunteerId}`, {
    id: volunteerId,
    status: status,
  })
}

/**
 * Get volunteer profile for a specific user
 */
export async function getUserVolunteerProfile(userId: number): Promise<Volunteer | null> {
  try {
    const volunteers = await get<Volunteer[]>(`/volunteers/?user_id=${userId}&limit=1`)
    return volunteers && volunteers.length > 0 ? volunteers[0] : null
  } catch (error) {
    console.error('Failed to fetch volunteer profile:', error)
    return null
  }
}

// ============= Resources API Functions =============

/**
 * Fetch all available resources for a specific volunteer
 */
export async function fetchVolunteerResources(volunteerId: number): Promise<ResourceAvailable[]> {
  try {
    const allResources = await get<ResourceAvailable[]>('/resources/available/')
    return allResources.filter(r => r.volunteer_id === volunteerId)
  } catch (error) {
    console.error('Failed to fetch resources:', error)
    return []
  }
}

export async function fetchResourcesNeededForEvent(eventId: number): Promise<ResourceNeeded[]> {
  try {
    const resources = await get<ResourceNeeded[]>('/resources/needed/')
    return resources.filter((resource) => resource.event_id === eventId)
  } catch (error) {
    console.error('Failed to fetch needed resources:', error)
    return []
  }
}

export async function fetchResourcesAvailableForEvent(eventId: number): Promise<ResourceAvailable[]> {
  try {
    const resources = await get<ResourceAvailable[]>('/resources/available/')
    return resources.filter((resource) => resource.event_id === eventId)
  } catch (error) {
    console.error('Failed to fetch available resources:', error)
    return []
  }
}

/**
 * Fetch all volunteers
 */
export async function fetchAllVolunteers(): Promise<Volunteer[]> {
  try {
    return await get<Volunteer[]>('/volunteers/')
  } catch (error) {
    console.error('Failed to fetch volunteers:', error)
    return []
  }
}

// ============= User-based endpoints (for dispatcher UI) =============

/**
 * Fetch active users for a specific event. Note: backend should support
 * filtering users by `event_id` and `status=active` for this to work.
 */
export async function fetchActiveUsers(eventId: number): Promise<User[]> {
  try {
    return await get<User[]>(`/users/?event_id=${eventId}&status=active`)
  } catch (error) {
    console.error('Failed to fetch users for event:', error)
    return []
  }
}

/**
 * Fetch all users (used where the UI previously listed volunteers)
 */
export async function fetchAllUsers(): Promise<User[]> {
  try {
    return await get<User[]>('/users/')
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return []
  }
}

/**
 * Create a new available resource
 */
export async function createResource(data: {
  name: string
  resource_type: string
  quantity: number
  description: string
  status: string
  volunteer_id: number
}): Promise<ResourceAvailable> {
  return post<ResourceAvailable>('/resources/available/', {
    ...data,
    is_allocated: false
  })
}

/**
 * Update an existing resource
 */
export async function updateResource(resourceId: number, data: Partial<{
  name: string
  resource_type: string
  quantity: number
  description: string
  status: string
  event_id: number | null
  volunteer_id: number
}>): Promise<ResourceAvailable> {
  return put<ResourceAvailable>(`/resources/available/${resourceId}`, data)
}

/**
 * Delete a resource
 */
export async function deleteResource(resourceId: number): Promise<void> {
  return del<void>(`/resources/available/${resourceId}`)
}
