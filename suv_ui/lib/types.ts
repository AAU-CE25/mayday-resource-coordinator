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
}

export interface Volunteer {
  id: number
  user: User
  event_id: number
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

export type TabType = "events" | "profile"
