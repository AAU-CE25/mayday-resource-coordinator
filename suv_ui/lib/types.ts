/**
 * Type definitions for SUV UI
 * Based on backend Pydantic schemas
 */

export interface LocationAddress {
  street?: string | null
  city?: string | null
  postcode?: string | null
  country?: string | null
}

export interface Location {
  id: number
  address?: LocationAddress | null
  latitude?: number | null
  longitude?: number | null
}

export interface User {
  id: number
  name: string
  email: string
  phonenumber?: string | null
  status: string
  role?: string
}

export interface Volunteer {
  id: number
  name: string
  phonenumber: string
  user?: User | null
  event_id: number | null
  user_id: number | null
  status: string
  create_time: string
  completion_time?: string | null
}

export interface Event {
  id: number
  description: string
  priority: number
  status: string
  create_time: string
  modified_time: string
  location: Location
  activeVolunteers?: number  // Count of active volunteers
}

export interface ResourceAvailable {
  id: number
  name: string
  resource_type: string
  quantity: number
  description: string
  status: string
  volunteer_id: number
  event_id: number | null
  is_allocated: boolean
}

export type TabType = "events" | "my-event" | "profile"

// ============= Auth Types =============

export interface AuthTokenResponse {
  access_token: string
  token_type: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  phonenumber: string
  password: string
  role?: string
}
