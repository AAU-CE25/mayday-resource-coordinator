const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

console.log('API_BASE configured as:', API_BASE)

export const api = {
  get: async (endpoint: string) => {
    console.log('API GET:', `${API_BASE}${endpoint}`)
    const response = await fetch(`${API_BASE}${endpoint}`)
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    const data = await response.json()
    console.log('API GET response:', endpoint, 'returned', Array.isArray(data) ? `${data.length} items` : 'data')
    return data
  },
  
  post: async (endpoint: string, data: any) => {
    console.log('API POST:', `${API_BASE}${endpoint}`, data)
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    return response.json()
  },

  delete: async (endpoint: string) => {
    console.log('API DELETE:', `${API_BASE}${endpoint}`)
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    return response.json()
  },

  put: async (endpoint: string, data: any) => {
    console.log('API PUT:', `${API_BASE}${endpoint}`, data)
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    return response.json()
  }
}