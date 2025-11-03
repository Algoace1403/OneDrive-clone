'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatBytes, formatDate } from '@/lib/utils'
import { Loader2, RotateCcw, History, MoreVertical, Download as DownloadIcon, GitCompare } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { toast } from '@/lib/hooks/use-toast'

interface VersionHistoryProps {
  file: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VersionHistory({ file, open, onOpenChange }: VersionHistoryProps) {
  const { user } = useAuth()
  const [versions, setVersions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [uploading, setUploading] = useState<boolean>(false)
  const [newVersionComment, setNewVersionComment] = useState<string>('')
  const [renaming, setRenaming] = useState<string | null>(null)
  const [newName, setNewName] = useState<string>('')
  const [compare, setCompare] = useState<number | null>(null)
  const [compareText, setCompareText] = useState<{ current?: string; prev?: string }>({})
  const fileInputId = `upload-version-${file?.id || file?._id || 'x'}`
  const isOwner = !!user && (
    (file?.owner_id && file.owner_id === user._id) ||
    (file?.owner?._id && file.owner._id === user._id)
  )

  useEffect(() => {
    if (open && file?.id) {
      loadVersions()
    }
  }, [open, file?.id])

  const loadVersions = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/files/${file.id || file._id}/versions`)
      setVersions(response.data.versions || [])
    } catch (error) {
      setVersions([])
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (versionNumber: number) => {
    try {
      setRestoring(String(versionNumber))
      await apiClient.post(`/files/${file.id || file._id}/versions/${versionNumber}/restore`)
      toast({ title: 'Restored', description: `Restored to version ${versionNumber}` })
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Restore failed',
        description: error.response?.data?.error || 'Could not restore version',
        variant: 'destructive',
      })
    } finally {
      setRestoring(null)
    }
  }

  const handleRestoreAs = async (versionNumber: number) => {
    try {
      setRestoring(String(versionNumber))
      await apiClient.post(`/files/${file.id || file._id}/versions/${versionNumber}/restore`, { name: newName || file.name })
      toast({ title: 'Restored', description: `Restored as "${newName || file.name}"` })
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Restore failed',
        description: error.response?.data?.error || 'Could not restore version',
        variant: 'destructive',
      })
    } finally {
      setRestoring(null)
      setRenaming(null)
    }
  }

  const handleDownload = async (versionNumber: number) => {
    try {
      const res = await apiClient.get(`/files/${file.id || file._id}/versions/${versionNumber}/download`)
      const url = res.data.downloadUrl
      const response = await fetch(url)
      const blob = await response.blob()
      const a = document.createElement('a')
      const dl = window.URL.createObjectURL(blob)
      a.href = dl
      a.download = res.data.filename || file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(dl)
    } catch {
      toast({ title: 'Error', description: 'Failed to download version', variant: 'destructive' })
    }
  }

  const handleCompare = async (versionNumber: number) => {
    setCompare(versionNumber === compare ? null : versionNumber)
    if (versionNumber === compare) return
    try {
      // current
      const cur = await apiClient.get(`/files/${file.id || file._id}/preview`)
      const pv = await apiClient.get(`/files/${file.id || file._id}/versions/${versionNumber}/preview`)
      const mime = cur.data.file?.mimeType || file.mimeType || ''
      if (mime.startsWith('text/') || mime.includes('json') || mime.includes('xml')) {
        const curText = await (await fetch(cur.data.previewUrl)).text()
        const prevText = await (await fetch(pv.data.previewUrl)).text()
        setCompareText({ current: curText, prev: prevText })
      } else {
        setCompareText({ current: '', prev: '' })
      }
    } catch {}
  }

  const handleUploadNewVersion = async (f: File | null) => {
    if (!f) return
    try {
      setUploading(true)
      const form = new FormData()
      form.append('file', f)
      if (newVersionComment) form.append('comment', newVersionComment)
      await apiClient.post(`/files/${file.id || file._id}/versions`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setNewVersionComment('')
      await loadVersions()
      toast({ title: 'Version uploaded', description: `${f.name} uploaded as a new version` })
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e?.response?.data?.error || 'Could not upload new version', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" /> Version history — {file?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-muted-foreground">Maintain multiple versions, restore older ones, and view authors.</div>
          {isOwner && (
          <div className="flex items-center gap-2">
            <input
              id={fileInputId}
              type="file"
              className="hidden"
              onChange={(e) => handleUploadNewVersion(e.target.files?.[0] || null)}
              disabled={uploading}
            />
            <input
              type="text"
              value={newVersionComment}
              onChange={(e) => setNewVersionComment(e.target.value)}
              placeholder="Comment (optional)"
              className="h-8 bg-[#111] border border-[#333] text-xs px-2 rounded"
            />
            <Button size="sm" variant="outline" disabled={uploading} onClick={() => document.getElementById(fileInputId)?.click()}>
              {uploading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
              Upload new version
            </Button>
          </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div>
            <table className="w-full text-sm border-separate border-spacing-y-1">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="px-2 py-2">Version</th>
                  <th className="px-2 py-2">Modified</th>
                  <th className="px-2 py-2">Size</th>
                  <th className="px-2 py-2">Modified by</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <>
                    <tr key={v.id} className="bg-card/30 hover:bg-card transition-colors">
                      <td className="px-2 py-2 align-top">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">v{v.version_number}</div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {isOwner && (
                                <DropdownMenuItem
                                  disabled={restoring !== null}
                                  onClick={() => handleRestore(v.version_number)}
                                >
                                  {restoring === String(v.version_number) ? (
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  ) : (
                                    <RotateCcw className="mr-2 h-3 w-3" />
                                  )}
                                  Restore
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleDownload(v.version_number)}>
                                <DownloadIcon className="mr-2 h-3 w-3" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCompare(v.version_number)}>
                                <GitCompare className="mr-2 h-3 w-3" />
                                {compare === v.version_number ? 'Hide compare' : 'Compare'}
                              </DropdownMenuItem>
                              {isOwner && (
                                <DropdownMenuItem onClick={() => { setRenaming(String(v.version_number)); setNewName(file.name) }}>
                                  <RotateCcw className="mr-2 h-3 w-3" />
                                  Restore as...
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <div>{formatDate(v.created_at)}</div>
                        {v.comment ? <div className="text-xs text-muted-foreground mt-1">{v.comment}</div> : null}
                      </td>
                      <td className="px-2 py-2 align-top">{formatBytes(v.size)}</td>
                      <td className="px-2 py-2 align-top">
                        {(() => {
                          const uploader = v.uploader || null
                          const displayName: string = (uploader?.name || uploader?.email || '-') as string
                          const initials = displayName
                            .split(/\s+/)
                            .map((p: string) => p.charAt(0).toUpperCase())
                            .slice(0, 2)
                            .join('')
                          const avatarUrl = uploader?.profile_picture || undefined
                          const hue = (() => {
                            const s = displayName || 'user'
                            let h = 0
                            for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h)
                            return Math.abs(h) % 360
                          })()
                          return (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
                                <AvatarFallback className="text-[10px] text-white" style={{ backgroundColor: `hsl(${hue} 70% 40%)` }}>
                                  {initials || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <span>{displayName}</span>
                            </div>
                          )
                        })()}
                      </td>
                    </tr>
                    {(isOwner && renaming === String(v.version_number)) && (
                      <tr>
                        <td colSpan={4} className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <input
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              className="h-8 bg-[#111] border border-[#333] text-xs px-2 rounded"
                              placeholder={file.name}
                            />
                            <Button size="sm" onClick={() => handleRestoreAs(v.version_number)}>Confirm</Button>
                            <Button size="sm" variant="ghost" onClick={() => setRenaming(null)}>Cancel</Button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {compare === v.version_number && (
                      <tr>
                        <td colSpan={4} className="px-2 py-2">
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-xs mb-1">Current</div>
                              <pre className="h-32 overflow-auto bg-[#111] p-2 text-xs border">{compareText.current || 'No text preview'}</pre>
                            </div>
                            <div>
                              <div className="text-xs mb-1">Version {v.version_number}</div>
                              <pre className="h-32 overflow-auto bg-[#111] p-2 text-xs border">{compareText.prev || 'No text preview'}</pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {versions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-sm text-muted-foreground py-8 text-center">No versions found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
