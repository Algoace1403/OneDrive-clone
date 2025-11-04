'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiClient } from '@/lib/api/client'
import { formatDate } from '@/lib/utils'
import { File, FolderOpen, Share2, Star, Trash2, RefreshCcw, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ActivityPage() {
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<any[]>([])

  const load = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/users/activity?limit=50')
      setActivities(res.data.activities || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const [actionFilter, setActionFilter] = useState<'all' | 'upload' | 'delete' | 'share' | 'restore_version' | 'create_folder'>('all')
  const [groupBy, setGroupBy] = useState<'none' | 'type' | 'day'>('none')
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')

  const [readAt, setReadAt] = useState<number>(() => {
    if (typeof window === 'undefined') return 0
    const raw = localStorage.getItem('activityReadAt')
    return raw ? parseInt(raw) : 0
  })

  const filtered = useMemo(() => {
    return activities.filter(a => {
      if (!(actionFilter === 'all' || a.action === actionFilter)) return false
      if (from) {
        if (new Date(a.created_at) < new Date(from)) return false
      }
      if (to) {
        const end = new Date(to)
        end.setHours(23,59,59,999)
        if (new Date(a.created_at) > end) return false
      }
      return true
    })
  }, [activities, actionFilter, from, to])

  const grouped = useMemo(() => {
    if (groupBy === 'none') return { All: filtered }
    if (groupBy === 'type') {
      return filtered.reduce((acc: any, a: any) => {
        const key = a.target_type || 'other'
        acc[key] = acc[key] || []
        acc[key].push(a)
        return acc
      }, {})
    }
    if (groupBy === 'day') {
      return filtered.reduce((acc: any, a: any) => {
        const key = new Date(a.created_at).toDateString()
        acc[key] = acc[key] || []
        acc[key].push(a)
        return acc
      }, {})
    }
    return { All: filtered }
  }, [filtered, groupBy])

  const iconFor = (action: string) => {
    switch (action) {
      case 'upload':
      case 'upload_version':
        return <File className="h-4 w-4" />
      case 'create_folder':
        return <FolderOpen className="h-4 w-4" />
      case 'share':
        return <Share2 className="h-4 w-4" />
      case 'favorite':
        return <Star className="h-4 w-4" />
      case 'delete':
        return <Trash2 className="h-4 w-4" />
      case 'restore_version':
        return <RefreshCcw className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="h-full bg-[#0c0c0c] p-6">
        <div className="mb-3 h-6 w-48 rounded bg-[#1b1b1b] animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded bg-[#111] p-3">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded bg-[#2b2b2b] animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 rounded bg-[#2b2b2b] animate-pulse" />
                  <div className="h-2 w-1/5 rounded bg-[#2b2b2b] animate-pulse" />
                </div>
                <div className="h-2 w-2 rounded-full bg-[#2b2b2b] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-[#0c0c0c] p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-light text-gray-300">Recent activity</h2>
        <div className="flex items-center gap-2">
          <Select value={actionFilter} onValueChange={(v: any) => setActionFilter(v)}>
            <SelectTrigger className="w-[180px] bg-[#1b1b1b] border-[#2b2b2b] text-gray-200 h-9">
              <SelectValue placeholder="Filter action" />
            </SelectTrigger>
            <SelectContent className="bg-[#1b1b1b] border-[#2b2b2b]">
              <SelectItem value="all" className="text-gray-300">All actions</SelectItem>
              <SelectItem value="upload" className="text-gray-300">Uploads</SelectItem>
              <SelectItem value="share" className="text-gray-300">Shares</SelectItem>
              <SelectItem value="delete" className="text-gray-300">Deletes</SelectItem>
              <SelectItem value="restore_version" className="text-gray-300">Restores</SelectItem>
              <SelectItem value="create_folder" className="text-gray-300">Folders</SelectItem>
            </SelectContent>
          </Select>
          <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
            <SelectTrigger className="w-[160px] bg-[#1b1b1b] border-[#2b2b2b] text-gray-200 h-9">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent className="bg-[#1b1b1b] border-[#2b2b2b]">
              <SelectItem value="none" className="text-gray-300">No grouping</SelectItem>
              <SelectItem value="type" className="text-gray-300">Type (file/folder)</SelectItem>
              <SelectItem value="day" className="text-gray-300">Day</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-[150px] bg-[#1b1b1b] border-[#2b2b2b] text-gray-200" />
            <span className="text-gray-500 text-sm">to</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-[150px] bg-[#1b1b1b] border-[#2b2b2b] text-gray-200" />
            <button
              className="text-xs text-gray-300 bg-[#1b1b1b] border border-[#2b2b2b] rounded px-2 py-1"
              onClick={() => { const t = Date.now(); setReadAt(t); try { localStorage.setItem('activityReadAt', String(t)) } catch {} }}
            >
              Mark all read
            </button>
          </div>
        </div>
      </div>

      {Object.entries(grouped).map(([group, items]: any) => (
        <div key={group} className="mb-4">
          {group !== 'All' && (
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">{group}</div>
          )}
          <div className="divide-y divide-[#2b2b2b] rounded border border-[#2b2b2b] bg-[#111]">
            {items.map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 p-3 text-sm">
                <div className="text-gray-300">{iconFor(a.action)}</div>
                <div className="flex-1">
                  <div className="text-gray-200">
                    <span className="font-medium">{a.action.replace('_', ' ')}</span> — {a.target_name}
                  </div>
                  <div className="text-xs text-gray-500">{formatDate(a.created_at)}</div>
                </div>
                {(!readAt || new Date(a.created_at).getTime() > readAt) && (
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                )}
              </div>
            ))}
            {items.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-400">No activity</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
