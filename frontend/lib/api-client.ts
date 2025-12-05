// Get API URL from environment variable - throws if not configured
function getApiBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  
  if (!apiUrl) {
    throw new Error(
      'NEXT_PUBLIC_API_URL environment variable is not set. ' +
      'Please configure it in your .env file or build arguments.'
    )
  }
  
  // Remove trailing slash to prevent double slashes
  return apiUrl.replace(/\/+$/, '')
}

const API_BASE = getApiBaseUrl()
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)

export const api = {
  get: async (endpoint: string) => {
    // Ensure endpoint starts with /
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const response = await fetch(`${API_BASE}${path}`)
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    return response.json()
  },
  
  post: async (endpoint: string, data: any) => {
    // Ensure endpoint starts with /
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    return response.json()
  }
}