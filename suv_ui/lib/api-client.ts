/**
 * API client for fetching data from backend
 * Base URL: http://localhost:8000
 */

import type { Volunteer, User, AuthTokenResponse, LoginCredentials, RegisterData } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

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
  return post<User>('/auth/register', data)
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
