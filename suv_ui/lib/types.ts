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

export interface Event {
  id: number
  description: string
  priority: number
  status: string
  create_time: string
  modified_time: string
  location: Location
}

export interface User {
  name: string
  role: string
  email: string
  phone: string
}

export type TabType = "events" | "profile"
