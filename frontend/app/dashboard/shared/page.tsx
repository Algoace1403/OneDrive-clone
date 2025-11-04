'use client'

import { useState, useEffect, useRef } from 'react'
import { apiClient } from '@/lib/api/client'
import { FileGrid } from '@/components/files/file-grid'
import { FileList } from '@/components/files/file-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, ShieldX } from 'lucide-react'
import { useViewMode } from '@/lib/contexts/view-mode-context'
import { toast } from '@/lib/hooks/use-toast'
import { ShareDialog } from '@/components/share/share-dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSocket } from '@/lib/hooks/use-socket'
import { FileGridSkeleton } from '@/components/files/file-grid-skeleton'
import { FileListSkeleton } from '@/components/files/file-list-skeleton'
import { useSharedLists } from '@/lib/queries/files'
import { useQueryClient } from '@tanstack/react-query'

export default function SharedPage() {
  const { viewMode } = useViewMode()
  const { socket } = useSocket()
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [sharedFiles, setSharedFiles] = useState<any[]>([])
  const [sharedByMe, setSharedByMe] = useState<any[]>([])
  const sharedQuery = useSharedLists()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'with-me' | 'by-me'>('with-me')
  const [shareFile, setShareFile] = useState<any>(null)
  const [bulkPermission, setBulkPermission] = useState<'view' | 'edit' | 'comment'>('view')
  const [loading, setLoading] = useState(false)
  const reqController = useRef<AbortController | null>(null)

  useEffect(() => {
    if (sharedQuery.data) {
      setSharedFiles(sharedQuery.data.sharedWithMe || [])
      setSharedByMe(sharedQuery.data.sharedByMe || [])
    }
  }, [sharedQuery.data])

  // Refresh when a new file is shared with the current user
  useEffect(() => {
    if (!socket) return
    const refresh = () => sharedQuery.refetch()
    socket.on('file-shared', refresh)
    return () => {
      socket.off('file-shared', refresh)
    }
  }, [socket])

  // loadSharedFiles is no longer needed - using React Query instead

  if (sharedQuery.isLoading) {
    return (
      <div className="h-full bg-background p-6">
        {viewMode === 'grid' ? <FileGridSkeleton /> : <FileListSkeleton />}
      </div>
    )
  }

  const handleFileClick = (file: any) => {
    // Open file preview
  }

  const handleDelete = (fileId: string) => {
    // Delete file
  }

  const handleFavorite = async (fileId: string) => {
    // Optimistic toggle in whichever tab is active
    if (tab === 'with-me') {
      const prev = sharedFiles
      setSharedFiles((cur) => cur.map(f => (f.id === fileId || (f as any)._id === fileId ? { ...f, isFavorite: !f.isFavorite } : f)))
      try { await apiClient.patch(`/files/${fileId}/favorite`); queryClient.invalidateQueries({ queryKey: ['shared-lists'] }) } catch { setSharedFiles(prev); toast({ title: 'Error', description: 'Failed to update favorite', variant: 'destructive' }) }
    } else {
      const prev = sharedByMe
      setSharedByMe((cur) => cur.map(f => (f.id === fileId || (f as any)._id === fileId ? { ...f, isFavorite: !f.isFavorite } : f)))
      try { await apiClient.patch(`/files/${fileId}/favorite`); queryClient.invalidateQueries({ queryKey: ['shared-lists'] }) } catch { setSharedByMe(prev); toast({ title: 'Error', description: 'Failed to update favorite', variant: 'destructive' }) }
    }
  }

  const handleShare = (fileId: string) => {
    const list = tab === 'with-me' ? sharedFiles : sharedByMe
    const file = list.find(f => (f.id || f._id) === fileId)
    if (file) setShareFile(file)
  }

  const handleDownload = (fileId: string) => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/files/${fileId}/download`, '_blank')
  }

  const removeAllAccess = async () => {
    if (tab !== 'by-me' || selectedFiles.length === 0) return
    try {
      await Promise.all(selectedFiles.map(async (id) => {
        const res = await apiClient.get(`/files/${id}/shares`)
        const shares = res.data.shares || []
        await Promise.all(shares.map((s: any) => apiClient.delete(`/files/shares/${s.id}`)))
      }))
      toast({ title: 'Access removed', description: 'Removed access for selected item(s)' })
      setSelectedFiles([])
      queryClient.invalidateQueries({ queryKey: ['shared-lists'] })
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to remove access', variant: 'destructive' })
    }
  }

  const handleFileAction = async (action: string, file: any) => {
    switch (action) {
      case 'download':
        try {
          const response = await apiClient.get(`/files/${file.id || file._id}/download`)
          if (response.data.downloadUrl) {
            const fileResponse = await fetch(response.data.downloadUrl)
            const blob = await fileResponse.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = response.data.filename || file.name
            a.style.display = 'none'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
            toast({
              title: 'Success',
              description: 'File downloaded successfully'
            })
          }
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to download file',
            variant: 'destructive'
          })
        }
        break
    }
  }

  const folders = (tab === 'with-me' ? sharedFiles : sharedByMe).filter(f => f.isFolder)
  const files = (tab === 'with-me' ? sharedFiles : sharedByMe).filter(f => !f.isFolder)

  return (
    <div className="h-full bg-[#0c0c0c] p-6">
      <div className="mb-4 flex items-center justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="bg-[#1b1b1b]">
            <TabsTrigger value="with-me">Shared with me</TabsTrigger>
            <TabsTrigger value="by-me">Shared by me</TabsTrigger>
          </TabsList>
        </Tabs>
        {tab === 'by-me' && selectedFiles.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={bulkPermission} onValueChange={(v: any) => setBulkPermission(v)}>
              <SelectTrigger className="w-[140px] h-8 bg-[#1b1b1b] border-[#2b2b2b] text-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1b1b1b] border-[#2b2b2b]">
                <SelectItem value="view" className="text-gray-300">Can view</SelectItem>
                <SelectItem value="edit" className="text-gray-300">Can edit</SelectItem>
                <SelectItem value="comment" className="text-gray-300">Can comment</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="h-8"
              onClick={async () => {
                try {
                  setLoading(true)
                  await Promise.all(selectedFiles.map(async (id) => {
                    const res = await apiClient.get(`/files/${id}/shares`)
                    const shares = res.data.shares || []
                    await Promise.all(shares.map((s: any) => apiClient.patch(`/share/${id}/${s.id}`, { permission: bulkPermission })))
                  }))
                  toast({ title: 'Permissions updated', description: `Set to ${bulkPermission} for selected item(s)` })
                  queryClient.invalidateQueries({ queryKey: ['shared-lists'] })
                } catch (e) {
                  toast({ title: 'Error', description: 'Failed to update permissions', variant: 'destructive' })
                } finally {
                  setLoading(false)
                }
              }}
            >
              Apply
            </Button>
            <Button onClick={removeAllAccess} variant="destructive" className="h-8">
              <ShieldX className="h-4 w-4 mr-2" /> Remove access
            </Button>
          </div>
        )}
      </div>

      {(tab === 'with-me' ? sharedFiles : sharedByMe).length === 0 ? (
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400">No files have been shared with you</p>
          </div>
        </div>
      ) : (
        viewMode === 'grid' ? (
          <FileGrid
            files={files}
            folders={folders}
            selectedFiles={selectedFiles}
            onFileSelect={setSelectedFiles}
            onFileClick={handleFileClick}
            onDelete={handleDelete}
            onFavorite={handleFavorite}
            onShare={handleShare}
            onDownload={(id) => {
              const file = files.find(f => (f.id || f._id) === id)
              if (file) handleFileAction('download', file)
            }}
          />
        ) : (
          <FileList
            files={files}
            folders={folders}
            selectedFiles={selectedFiles}
            onFileSelect={setSelectedFiles}
            onFileClick={handleFileClick}
            onDelete={handleDelete}
            onFavorite={handleFavorite}
            onShare={handleShare}
            onDownload={(id) => {
              const file = files.find(f => (f.id || f._id) === id)
              if (file) handleFileAction('download', file)
            }}
          />
        )
      )}
      {shareFile && (
        <ShareDialog
          file={shareFile}
          open={!!shareFile}
          onOpenChange={(open) => !open && setShareFile(null)}
        />
      )}
    </div>
  )
}
