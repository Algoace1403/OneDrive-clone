'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'
import { useSocket } from './use-socket'

export function useSyncStatusCounts() {
  const [syncing, setSyncing] = useState(0)
  const [failed, setFailed] = useState(0)
  const { socket } = useSocket()

  const load = async () => {
    try {
      const res = await apiClient.get('/sync/status')
      const arr = res.data.files || []
      setSyncing(arr.filter((f: any) => f.sync_status === 'syncing').length)
      setFailed(arr.filter((f: any) => f.sync_status === 'error').length)
    } catch {
      setSyncing(0); setFailed(0)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 10000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!socket) return
    const refresh = () => load()
    socket.on('file-updated', refresh)
    return () => { socket.off('file-updated', refresh) }
  }, [socket])

  return { syncing, failed, refresh: load }
}

