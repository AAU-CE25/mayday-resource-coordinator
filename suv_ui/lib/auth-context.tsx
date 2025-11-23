"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { User } from './types'
import { getCurrentUser, logout as apiLogout, getAuthToken } from './api-client'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: () => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    async function loadUser() {
      const token = getAuthToken()
      
      // No token - redirect to login if not already there
      if (!token) {
        setIsLoading(false)
        if (!pathname?.startsWith('/login') && !pathname?.startsWith('/register')) {
          router.push('/login')
        }
        return
      }

      // Token exists - fetch user data
      try {
        const userData = await getCurrentUser()
        setUser(userData)
        
        // If on auth pages with valid session, redirect to app
        if (pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
          router.push('/')
        }
      } catch (error) {
        console.error('Failed to load user:', error)
        setUser(null)
        if (!pathname?.startsWith('/login') && !pathname?.startsWith('/register')) {
          router.push('/login')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [pathname, router])

  const login = async () => {
    try {
      const userData = await getCurrentUser()
      setUser(userData)
      router.push('/')
    } catch (error) {
      console.error('Failed to get user after login:', error)
      throw error
    }
  }

  const logout = () => {
    apiLogout()
    setUser(null)
    router.push('/login')
  }

  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      logout()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
