import type { UserResponse, LoginCredentials, AuthTokenResponse } from "./types"

// Get API URL from environment variable - throws if not configured
function getApiBaseUrl(): string {
  let apiUrl = process.env.API_URL
  
  if (!apiUrl) {
    apiUrl = 'http://localhost:8000'  // Default for local development
    console.warn(
      'API_URL is not set. Defaulting to http://localhost:8000'
    )
  }
  
  // Validate that URL includes protocol
  if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
    throw new Error(
      `API_URL must include protocol (http:// or https://). Got: ${apiUrl}`
    )
  }
  
  // Remove trailing slash to prevent double slashes
  const cleanUrl = apiUrl.replace(/\/+$/, '')
  
  console.log('API Base URL:', cleanUrl)
  return cleanUrl
}

const API_BASE = getApiBaseUrl()

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
 * Generic fetch wrapper with auth and error handling
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${API_BASE}${path}`
  const token = getAuthToken()
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  }
  
  const response = await fetch(url, {
    headers,
    cache: "no-store",
    ...options,
  })

  // Handle unauthorized - clear token and redirect (but not for login endpoint)
  if (response.status === 401) {
    const isLoginEndpoint = endpoint.includes('/auth/login')
    
    if (!isLoginEndpoint) {
      clearAuthToken()
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/dashboard/login')) {
        window.location.href = '/dashboard/login'
      }
    }
    
    const errorText = await response.text().catch(() => 'Unauthorized')
    throw new Error(`API error ${response.status}: ${errorText}`)
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
}

export const api = {
  get: async <T = any>(endpoint: string): Promise<T> => {
    return apiFetch<T>(endpoint, { method: 'GET' })
  },
  
  post: async <T = any>(endpoint: string, data?: any): Promise<T> => {
    return apiFetch<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  delete: async <T = any>(endpoint: string): Promise<T> => {
    return apiFetch<T>(endpoint, { method: 'DELETE' })
  },

  put: async <T = any>(endpoint: string, data?: any): Promise<T> => {
    return apiFetch<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
}

// ============= Auth API Functions =============

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthTokenResponse> {
  const response = await api.post<AuthTokenResponse>('/auth/login', credentials)
  setAuthToken(response.access_token)
  return response
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<UserResponse> {
  return api.get<UserResponse>('/auth/me')
}

/**
 * Logout (clear token)
 */
export function logout() {
  clearAuthToken()
}