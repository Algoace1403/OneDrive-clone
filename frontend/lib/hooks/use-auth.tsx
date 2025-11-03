'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { toast } from '@/lib/hooks/use-toast'

interface User {
  _id: string
  email: string
  name: string
  profilePicture?: string
  storageUsed: number
  storageLimit: number
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const response = await apiClient.get('/auth/me')
        setUser(response.data.user)
      } catch (error) {
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password })
      const { token, refreshToken, user } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      setUser(user)
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.name}`,
      })
      
      router.push('/dashboard')
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.response?.data?.error || "Invalid credentials",
        variant: "destructive",
      })
      throw error
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      console.log('Registering user:', { email, name, passwordLength: password.length });
      
      const response = await apiClient.post('/auth/register', {
        email,
        password,
        name,
      })
      const { token, refreshToken, user } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      setUser(user)
      
      toast({
        title: "Account created!",
        description: "Welcome to OneDrive Clone",
      })
      
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Registration error:', error.response?.data || error);
      
      const errorMessage = error.response?.data?.errors 
        ? error.response.data.errors[0].msg 
        : error.response?.data?.error || "Something went wrong";
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      })
      throw error
    }
  }

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      // Continue with logout even if API call fails
    }
    
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    setUser(null)
    router.push('/auth/login')
    
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await apiClient.patch('/auth/profile', data)
      setUser(response.data.user)
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.response?.data?.error || "Failed to update profile",
        variant: "destructive",
      })
      throw error
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}