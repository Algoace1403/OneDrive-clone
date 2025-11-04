'use client'

import React, { createContext, useContext, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './use-auth'
import { useNotifications } from '../contexts/notifications'
import { toast } from './use-toast'

interface SocketContextType {
  socket: Socket | null
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null)
  const { user } = useAuth()
  const { add } = useNotifications()

  useEffect(() => {
    if (user) {
      // Connect to socket
      const socketUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL ||
        (process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') as string) ||
        'http://localhost:5001'
      const socket = io(socketUrl, {
        auth: {
          token: localStorage.getItem('token'),
        },
      })

      socket.on('connect', () => {
        console.log('Socket connected')
        socket.emit('join-user', user._id)
      })

      socket.on('disconnect', () => {
        console.log('Socket disconnected')
      })

      socket.on('file-updated', (data) => {
        const name = data?.file?.name || data?.fileName || 'A file'
        toast({
          title: "File updated",
          description: `${name} has been updated`,
        })
        add({ title: 'File updated', description: `${name} was updated` })
      })

      socket.on('file-shared', (data) => {
        const sharer = data?.sharedBy?.name || 'Someone'
        const name = data?.file?.name || 'a file'
        toast({
          title: "New shared file",
          description: `${sharer} shared "${name}" with you`,
        })
        add({ title: 'File shared with you', description: `${sharer} shared ${name}` })
      })

      socket.on('file-created', (data) => {
        const name = data?.file?.name || 'A file'
        toast({
          title: "File created",
          description: `${name} has been created`,
        })
        add({ title: 'File created', description: `${name} was created` })
      })

      socket.on('folder-created', (data) => {
        toast({
          title: "Folder created",
          description: `${data.folder.name} has been created`,
        })
        add({ title: 'Folder created', description: `${data.folder?.name || 'A folder'} was created` })
      })

      socket.on('comment-added', (data) => {
        toast({ title: 'New comment', description: data?.comment?.content || 'A comment was added' })
        add({ title: 'New comment', description: data?.comment?.content || 'A comment was added' })
      })
      socket.on('comment-updated', () => {
        toast({ title: 'Comment updated' })
        add({ title: 'Comment updated' })
      })
      socket.on('comment-deleted', () => {
        toast({ title: 'Comment deleted' })
        add({ title: 'Comment deleted' })
      })

      socketRef.current = socket

      return () => {
        socket.disconnect()
      }
    }
  }, [user])

  const value = {
    socket: socketRef.current,
  }

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
