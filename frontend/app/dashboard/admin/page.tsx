'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [limits, setLimits] = useState<Record<string, string>>({})
  const [error, setError] = useState<string>('')

  const load = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/admin/users')
      setUsers(res.data.users || [])
    } catch (e: any) {
      setError('Not authorized or failed to load users (set ADMIN_USER_IDS on backend).')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const updateLimit = async (id: string) => {
    const val = parseInt(limits[id] || '')
    if (!val || val <= 0) return
    await apiClient.patch(`/admin/users/${id}/storage`, { limit: val })
    await load()
  }

  if (loading) return <div className="p-6 text-gray-300">Loading...</div>

  if (error) return <div className="p-6 text-red-400">{error}</div>

  return (
    <div className="p-6 text-gray-200">
      <h2 className="text-xl mb-4">Admin — Storage Limits</h2>
      <div className="space-y-3">
        {users.map(u => (
          <div key={u.id} className="flex items-center gap-4 border-b border-[#2b2b2b] pb-3">
            <div className="flex-1">
              <div className="font-medium">{u.name} <span className="text-xs text-gray-400">({u.email})</span></div>
              <div className="text-xs text-gray-400">Used: {(u.storage_used/1024/1024).toFixed(2)} MB • Limit: {(u.storage_limit/1024/1024).toFixed(2)} MB</div>
            </div>
            <Input
              placeholder={`${(u.storage_limit/1024/1024).toFixed(0)} MB`}
              className="w-40 bg-[#111] border-[#333]"
              value={limits[u.id] || ''}
              onChange={(e) => setLimits({ ...limits, [u.id]: e.target.value })}
            />
            <Button onClick={() => updateLimit(u.id)}>Update</Button>
          </div>
        ))}
      </div>
    </div>
  )
}
