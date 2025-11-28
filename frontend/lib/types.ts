// Types based on domain/schemas.py

// ------------------ User ------------------
export interface UserCreate {
  name: string
  email: string
  phonenumber: string
  password: string
  role?: string  // "SUV" | "VC" | "AUTHORITY"
}

export interface UserUpdate {
  name?: string | null
  email?: string | null
  phonenumber?: string | null
  status?: string | null  // "available" | "assigned" | "unavailable"
}

export interface UserResponse {
  id: number
  name: string
  email: string
  phonenumber?: string | null
  status: string
  role?: string | null
}

// ------------------ Volunteer ------------------
export interface VolunteerCreate {
  event_id?: number | null
  user_id?: number | null
  status?: string  // "active" | "completed"
}

export interface VolunteerUpdate {
  id: number
  user_id?: number | null
  event_id?: number | null
  status?: string | null
}

export interface VolunteerResponse {
  id: number
  user?: UserResponse | null
  event_id?: number | null
  status: string
  create_time: string
  completion_time?: string | null
}

// ------------------ Location ------------------
export interface LocationAddress {
  street?: string | null
  city?: string | null
  postcode?: string | null
  country?: string | null
}

export interface LocationCreate {
  latitude?: number | null
  longitude?: number | null
  address?: LocationAddress | null
}

export interface LocationUpdate {
  id: number
  address?: LocationAddress | null
  latitude?: number | null
  longitude?: number | null
}

export interface LocationResponse {
  id: number
  address?: LocationAddress | null
  latitude?: number | null
  longitude?: number | null
}

// ------------------ Event ------------------
export interface EventCreate {
  description: string
  priority: number  // 1-5
  status: string
  location: LocationCreate
}

export interface EventUpdate {
  description?: string | null
  priority?: number | null
  status?: string | null
  location?: LocationCreate | null
}

export interface EventResponse {
  id: number
  description: string
  priority: number
  status: string
  create_time: string
  modified_time: string
  location: LocationResponse
  volunteers_count: number
}

// ------------------ ResourceNeeded ------------------
export interface ResourceNeededCreate {
  name: string
  resource_type: string
  description: string
  quantity: number
  is_fulfilled?: boolean
  event_id: number
}

export interface ResourceNeededUpdate {
  name?: string | null
  resource_type?: string | null
  description?: string | null
  quantity?: number | null
  is_fulfilled?: boolean | null
  event_id?: number | null
}

export interface ResourceNeededResponse {
  id: number
  name: string
  resource_type: string
  description: string
  quantity: number
  is_fulfilled: boolean
  event_id: number
}

// ------------------ ResourceAvailable ------------------
export interface ResourceAvailableCreate {
  name: string
  resource_type: string
  quantity: number
  description: string
  status: string
  volunteer_id: number
  event_id?: number | null
  is_allocated?: boolean
}

export interface ResourceAvailableUpdate {
  name?: string | null
  resource_type?: string | null
  quantity?: number | null
  description?: string | null
  status?: string | null
  volunteer_id?: number | null
  event_id?: number | null
  is_allocated?: boolean | null
}

export interface ResourceAvailableResponse {
  id: number
  name: string
  resource_type: string
  quantity: number
  description: string
  status: string
  volunteer_id: number
  event_id?: number | null
  is_allocated: boolean
}

// ------------------ Stats ------------------
export interface StatsResponse {
  activeEvents: number
  totalVolunteers: number
  resourcesAvailable: number
  totalLocations: number
}

// ------------------ Form Data Defaults ------------------
export const initialUserFormData: UserCreate = {
  name: '',
  email: '',
  phonenumber: '',
  password: '',
  role: 'SUV',
}

export const initialVolunteerFormData: VolunteerCreate = {
  event_id: null,
  user_id: null,
  status: 'active',
}
