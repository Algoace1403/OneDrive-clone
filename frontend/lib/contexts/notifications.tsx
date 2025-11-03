'use client'

import React, { createContext, useContext, useMemo, useState } from 'react'

export interface NotificationItem {
  id: string
  title: string
  description?: string
  ts: number
  read?: boolean
}

interface NotificationsContextType {
  items: NotificationItem[]
  add: (n: Omit<NotificationItem, 'id' | 'ts' | 'read'>) => void
  markAllRead: () => void
  unreadCount: number
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem('notifications')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const add: NotificationsContextType['add'] = (n) => {
    setItems((prev) => [{ id: Math.random().toString(36).slice(2), ts: Date.now(), read: false, ...n }, ...prev].slice(0, 50))
  }
  const markAllRead = () => setItems((prev) => prev.map(i => ({ ...i, read: true })))
  const unreadCount = useMemo(() => items.filter(i => !i.read).length, [items])

  // persist
  React.useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(items))
    } catch {}
  }, [items])

  return (
    <NotificationsContext.Provider value={{ items, add, markAllRead, unreadCount }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider')
  return ctx
}
