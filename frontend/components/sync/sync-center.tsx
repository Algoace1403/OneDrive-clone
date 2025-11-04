'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'
import { useSocket } from '@/lib/hooks/use-socket'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, RefreshCcw, AlertTriangle } from 'lucide-react'
import { toast } from '@/lib/hooks/use-toast'

interface SyncCenterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SyncCenter({ open, onOpenChange }: SyncCenterProps) {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const { socket } = useSocket()
  const [failedOnly, setFailedOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'status_asc' | 'status_desc'>('status_desc')
  const [statusTab, setStatusTab] = useState<'all' | 'syncing' | 'error'>('all')
  const failedCount = items.filter(i => i.sync_status === 'error').length
  const syncingCount = items.filter(i => i.sync_status === 'syncing').length
  const router = useRouter()

  const load = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/sync/status')
      setItems(res.data.files || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) load()
  }, [open])

  useEffect(() => {
    if (!socket) return
    const refresh = () => { if (open) load() }
    socket.on('file-updated', refresh)
    return () => { socket.off('file-updated', refresh) }
  }, [socket, open])

  // Persist UI state
  useEffect(() => {
    if (!open) return
    try {
      const raw = localStorage.getItem('syncCenterState')
      if (raw) {
        const state = JSON.parse(raw)
        if (state.failedOnly !== undefined) setFailedOnly(!!state.failedOnly)
        if (state.sortBy) setSortBy(state.sortBy)
        if (state.statusTab) setStatusTab(state.statusTab)
      }
    } catch {}
  }, [open])
  useEffect(() => {
    if (!open) return
    try {
      localStorage.setItem('syncCenterState', JSON.stringify({ failedOnly, sortBy, statusTab }))
    } catch {}
  }, [failedOnly, sortBy, statusTab, open])

  const syncRecent = async () => {
    try {
      await apiClient.post('/sync/simulate', {})
      toast({ title: 'Sync started', description: 'Simulating recent files sync...' })
      load()
    } catch {
      toast({ title: 'Error', description: 'Failed to start sync', variant: 'destructive' })
    }
  }

  const retry = async (id: string) => {
    try {
      await apiClient.post('/sync/simulate', { ids: [id] })
      load()
    } catch {}
  }

  const resolve = (file: any) => {
    const ev = new CustomEvent('open-conflict-dialog', { detail: { file } })
    window.dispatchEvent(ev)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Sync Center</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              <span className="ml-2">Refresh</span>
            </Button>
            <div className="text-xs text-muted-foreground">
              <span className="mr-3"><span className="inline-block align-middle h-2 w-2 rounded-full bg-red-500 mr-1" /> {failedCount} failed</span>
              <span><span className="inline-block align-middle h-2 w-2 rounded-full bg-blue-500 mr-1" /> {syncingCount} syncing</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground flex items-center gap-1">
              <input type="checkbox" checked={failedOnly} onChange={(e) => setFailedOnly(e.target.checked)} />
              Failed only
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-8 bg-secondary border border-border text-foreground text-xs rounded px-2"
            >
              <option value="status_desc">Status (failed first)</option>
              <option value="status_asc">Status (synced first)</option>
              <option value="name_asc">Name (A→Z)</option>
              <option value="name_desc">Name (Z→A)</option>
            </select>
            <Button size="sm" onClick={syncRecent}>
              <RefreshCcw className="h-4 w-4" />
              <span className="ml-2">Sync recent</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                const failedIds = items.filter(i => i.sync_status === 'error').map(i => i.id)
                if (failedIds.length === 0) return
                const confirmed = window.confirm(`Retry sync for ${failedIds.length} failed item(s)?`)
                if (!confirmed) return
                try {
                  await apiClient.post('/sync/simulate', { ids: failedIds })
                  const { toast } = await import('@/lib/hooks/use-toast')
                  toast({ title: 'Retry started', description: `Retrying ${failedIds.length} failed item(s)` })
                  load()
                } catch {
                  const { toast } = await import('@/lib/hooks/use-toast')
                  toast({ title: 'Error', description: 'Failed to retry all', variant: 'destructive' })
                }
              }}
            >
              Retry all failed
            </Button>
          </div>
        </div>

        <Tabs value={statusTab} onValueChange={(v: any) => setStatusTab(v)} className="mb-2">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="syncing">Syncing</TabsTrigger>
            <TabsTrigger value="error">Failed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground mb-2">
          <span>
            <span className="inline-block align-middle h-2 w-2 rounded-full bg-blue-500 mr-1" /> Syncing
          </span>
          <span>
            <span className="inline-block align-middle h-2 w-2 rounded-full bg-red-500 mr-1" /> Failed
          </span>
        </div>

        <div className="space-y-2 max-h-80 overflow-auto">
          {items.length === 0 && (
            <div className="text-sm text-muted-foreground">All files are synced.</div>
          )}
          {items
            .filter((f) => (statusTab === 'all' ? true : f.sync_status === statusTab))
            .filter((f) => (failedOnly ? f.sync_status === 'error' : true))
            .sort((a, b) => {
              if (sortBy.startsWith('name')) {
                const dir = sortBy.endsWith('asc') ? 1 : -1
                return (a.name || '').localeCompare(b.name || '') * dir
              } else {
                // status order: error > syncing > others
                const rank = (s: string) => (s === 'error' ? 2 : s === 'syncing' ? 1 : 0)
                const dir = sortBy.endsWith('asc') ? 1 : -1
                return (rank(a.sync_status) - rank(b.sync_status)) * dir
              }
            })
            .map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded border px-3 py-2">
              <div className="flex items-center gap-3">
                {/* Thumbnail for images */}
                {f.mimeType?.startsWith?.('image/') ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/files/${f.id}/thumbnail?width=36&height=36`}
                    alt="thumb"
                    className="h-9 w-9 object-cover rounded"
                  />
                ) : (
                  <div className="h-9 w-9 rounded bg-secondary border border-border" />
                )}
                <div>
                  <div className="text-sm flex items-center gap-2">
                    {f.name}
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${f.sync_status === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}
                      title={f.sync_status}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">Status: {f.sync_status}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {f.sync_status === 'error' ? (
                  <Button variant="destructive" size="sm" onClick={() => resolve(f)}>
                    <AlertTriangle className="h-4 w-4" />
                    <span className="ml-1">Resolve</span>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => retry(f.id)}>
                    Retry
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const folder = f.parentId || f.parent_id
                    if (folder) router.push(`/dashboard/files?folder=${folder}`)
                    else router.push('/dashboard/files')
                    onOpenChange(false)
                  }}
                  title="Open in folder"
                >
                  Open
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
