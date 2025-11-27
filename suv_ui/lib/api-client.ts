/**
 * API client for fetching data from backend
 * Base URL: http://localhost:8000 (browser) or http://api_service:8000 (SSR in Docker)
 */

import type { Volunteer, User, AuthTokenResponse, LoginCredentials, RegisterData, ResourceAvailable } from "./types"

// Determine API URL based on execution context
// - Client-side (browser): always use localhost (accessible from user's machine)
// - Server-side (SSR): use build-time env var (api_service for Docker, localhost for dev)
function getApiBaseUrl(): string {
  // Client-side (browser): always use localhost:8000
  if (typeof window !== 'undefined') {
    return 'http://localhost:8000'
  }
  
  // Server-side: use Docker internal network in production
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
}

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
  const url = `${getApiBaseUrl()}${endpoint}`
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
 * Register a new user and automatically create their volunteer profile
 */
export async function register(data: RegisterData): Promise<User> {
  // Create user account
  const user = await post<User>('/auth/register', data)
  
  // Create volunteer profile linked to the user
  try {
    await post<Volunteer>('/volunteers/', {
      name: data.name,
      phonenumber: data.phonenumber,
      user_id: user.id,
      status: "active"
    })
  } catch (error) {
    console.error('Failed to create volunteer profile:', error)
    // Don't throw - user account is created successfully
  }
  
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
