/**
 * API client for fetching data from backend
 * Base URL must be configured via NEXT_PUBLIC_API_URL environment variable
 * 
 * This file contains ONLY core HTTP functions and authentication API calls.
 * Domain-specific functions are in their respective hooks:
 * - useAuth() for current user and authentication
 * - useUsers() for user management
 * - useEvents() for events
 * - useVolunteers() for volunteer assignments
 * - useResources() for resource management
 */

import type { User, AuthTokenResponse, LoginCredentials, RegisterData } from "./types"

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

// ============= Domain-Specific Functions Moved to Hooks =============
// All domain-specific functions have been moved to their respective hooks:
// - useAuth() for authentication and current user
// - useUsers() for user management  
// - useEvents() for event operations
// - useVolunteers() for volunteer assignments
// - useResources() for resource management
