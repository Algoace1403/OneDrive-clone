'use client'

import { useState, useEffect, useRef, DragEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FileGrid } from '@/components/files/file-grid'
import { FileList } from '@/components/files/file-list'
import { FileGridSkeleton } from '@/components/files/file-grid-skeleton'
import { FileListSkeleton } from '@/components/files/file-list-skeleton'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { RenameDialog } from '@/components/files/rename-dialog'
import { DeleteDialog } from '@/components/files/delete-dialog'
import { MoveDialog } from '@/components/files/move-dialog'
import { FilePreviewModal } from '@/components/preview/file-preview-modal'
import { ShareDialog } from '@/components/share/share-dialog'
import { DetailsPanel } from '@/components/layout/details-panel'
import { apiClient } from '@/lib/api/client'
import { Loader2, Share2, Link, Trash2, Download, Move, Copy, FileText, X } from 'lucide-react'
import { toast } from '@/lib/hooks/use-toast'
import { useViewMode } from '@/lib/contexts/view-mode-context'
import { Button } from '@/components/ui/button'
import { useSocket } from '@/lib/hooks/use-socket'
import { ConflictDialog } from '@/components/files/conflict-dialog'
import { VersionHistory } from '@/components/files/version-history'
import { useSearch } from '@/lib/contexts/search-context'

export default function FilesPage() {
  const { viewMode } = useViewMode()
  const { query: searchQuery, filters, sort } = useSearch()
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  const reqController = useRef<AbortController | null>(null)
  const searchParams = useSearchParams()
  const folderId = searchParams.get('folder')
  const router = useRouter()
  
  const [files, setFiles] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [shareCounts, setShareCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [renameFile, setRenameFile] = useState<any>(null)
  const [deleteFiles, setDeleteFiles] = useState<any[]>([])
  const [moveFiles, setMoveFiles] = useState<any[]>([])
  const [draggedFiles, setDraggedFiles] = useState<any[]>([])
  const [previewFile, setPreviewFile] = useState<any>(null)
  const [shareFile, setShareFile] = useState<any>(null)
  const [detailsFile, setDetailsFile] = useState<any>(null)
  const [conflictFile, setConflictFile] = useState<any>(null)
  const [versionFile, setVersionFile] = useState<any>(null)
  const { socket } = useSocket()

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    loadFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, debouncedSearch])

  useEffect(() => {
    if (!socket) return
    const refresh = () => loadFiles()
    socket.on('file-created', refresh)
    socket.on('file-deleted', refresh)
    socket.on('file-updated', refresh)
    socket.on('folder-created', refresh)
    return () => {
      socket.off('file-created', refresh)
      socket.off('file-deleted', refresh)
      socket.off('file-updated', refresh)
      socket.off('folder-created', refresh)
    }
  }, [socket])

  const loadFiles = async () => {
    try {
      setLoading(true)

      let endpoint = '/files'
      if (folderId) {
        // Backend expects `parent` as the query param
        endpoint += `?parent=${folderId}`
      }
      if (reqController.current) reqController.current.abort()
      reqController.current = new AbortController()
      const signal = reqController.current.signal
      const thisController = reqController.current

      if (debouncedSearch) {
        endpoint += `${endpoint.includes('?') ? '&' : '?'}q=${encodeURIComponent(searchQuery)}`
      }
      // filters
      if (filters?.type && filters.type !== 'all') {
        endpoint += `${endpoint.includes('?') ? '&' : '?'}type=${filters.type}`
      }
      if (filters?.owner && filters.owner !== 'all') {
        endpoint += `${endpoint.includes('?') ? '&' : '?'}owner=${filters.owner}`
      }
      if (filters?.syncStatus && filters.syncStatus !== 'all') {
        endpoint += `${endpoint.includes('?') ? '&' : '?'}status=${filters.syncStatus}`
      }
      if (sort) {
        endpoint += `${endpoint.includes('?') ? '&' : '?'}sort=${sort.field}&direction=${sort.direction}`
      }

      const response = await apiClient.get(endpoint, { signal })
      if (reqController.current !== thisController) return // stale

      // Backend returns folders separately under `folders` and regular files under `files`
      const folderItems = response.data.folders || []
      const fileItems = response.data.files || []
      // Fetch share counts and favorite flags for all items
      const ids = [...folderItems, ...fileItems].map((i: any) => i.id || i._id).filter(Boolean)
      let counts: Record<string, number> = {}
      let favs: Record<string, boolean> = {}
      if (ids.length > 0) {
        try {
          const meta = await apiClient.get(`/files/meta?ids=${ids.join(',')}`, { signal })
          if (reqController.current !== thisController) return // stale
          counts = meta.data?.counts || {}
          favs = meta.data?.favorites || {}
        } catch {
          counts = {}
          favs = {}
        }
      }
      // Attach counts and favorites to items for rendering
      const annotate = (arr: any[]) => arr.map((i) => ({
        ...i,
        sharedCount: counts[i.id || i._id] || 0,
        isFavorite: !!favs[i.id || i._id]
      }))
      setFolders(annotate(folderItems))
      setFiles(annotate(fileItems))
      setShareCounts(counts)
      setLoading(false)
    } catch (error: any) {
      // Ignore aborted requests to prevent flicker
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return
      console.error('Error loading files:', error)
      toast({
        title: 'Error',
        description: 'Failed to load files',
        variant: 'destructive'
      })
      setFiles([])
      setFolders([])
      setLoading(false)
    }
  }

  const handleFileAction = async (action: string, file: any) => {
    console.log('handleFileAction:', action, 'file:', file);
    switch (action) {
      case 'open':
        if (file.isFolder) {
          // Navigate to folder (client-side)
          router.push(`/dashboard/files?folder=${file.id || file._id}`)
        } else {
          // Open preview modal
          setPreviewFile(file)
        }
        break
      
      case 'download':
        console.log('Download file:', file);
        const downloadId = file?.id || file?._id;
        if (!file || !downloadId) {
          console.error('Invalid file for download:', file);
          toast({
            title: 'Error',
            description: 'Invalid file selected',
            variant: 'destructive'
          })
          return
        }
        try {
          const response = await apiClient.get(`/files/${downloadId}/download`)
          if (response.data.downloadUrl) {
            // Fetch the file from the signed URL and force download
            const fileResponse = await fetch(response.data.downloadUrl)
            const blob = await fileResponse.blob()
            
            // Create a download link
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
          console.error('Download error:', error)
          toast({
            title: 'Error',
            description: 'Failed to download file',
            variant: 'destructive'
          })
        }
        break
      
      case 'delete':
        console.log('Delete file:', file);
        const deleteId = file?.id || file?._id;
        if (!file || !deleteId) {
          console.error('Invalid file for delete:', file);
          toast({
            title: 'Error',
            description: 'Invalid file selected',
            variant: 'destructive'
          })
          return
        }
        setDeleteFiles([file])
        break
      
      case 'rename':
        console.log('Rename file:', file);
        const renameId = file?.id || file?._id;
        if (!file || !renameId) {
          console.error('Invalid file for rename:', file);
          toast({
            title: 'Error',
            description: 'Invalid file selected',
            variant: 'destructive'
          })
          return
        }
        setRenameFile(file)
        break
      
      case 'favorite':
        console.log('Favorite file:', file);
        const favoriteId = file?.id || file?._id;
        if (!favoriteId) {
          console.error('Invalid file for favorite:', file);
          toast({
            title: 'Error',
            description: 'Invalid file selected',
            variant: 'destructive'
          })
          return
        }
        // Optimistic toggle
        const prevFiles = files
        const prevFolders = folders
        setFiles((cur) => cur.map((f) => (f.id === favoriteId || (f as any)._id === favoriteId ? { ...f, isFavorite: !f.isFavorite } : f)))
        setFolders((cur) => cur.map((f) => (f.id === favoriteId || (f as any)._id === favoriteId ? { ...f, isFavorite: !f.isFavorite } : f)))
        try {
          await apiClient.patch(`/files/${favoriteId}/favorite`)
          toast({
            title: 'Success',
            description: file.isFavorite ? 'Removed from favorites' : 'Added to favorites'
          })
        } catch (error) {
          // Revert on failure
          setFiles(prevFiles)
          setFolders(prevFolders)
          // Show clearer message for permission errors
          const status = (error as any)?.response?.status
          const message = status === 403 ? 'You do not have access to this file' : 'Failed to update favorite status'
          toast({
            title: 'Error',
            description: message,
            variant: 'destructive'
          })
        }
        break
      
      case 'share':
        setShareFile(file)
        break
      case 'details':
        try {
          const id = file.id || file._id
          const [sharesRes, versionsRes] = await Promise.all([
            apiClient.get(`/files/${id}/shares`).catch(() => ({ data: { shares: [] } })),
            apiClient.get(`/files/${id}/versions`).catch(() => ({ data: { versions: [] } })),
          ])
          setDetailsFile({
            ...file,
            sharedWith: sharesRes.data?.shares || [],
            versions: versionsRes.data?.versions || [],
          })
        } catch {
          setDetailsFile(file)
        }
        break
      case 'versions':
        setVersionFile(file)
        break
    }
  }

  const handleNavigate = (targetFolderId: string | null) => {
    if (targetFolderId) {
      router.push(`/dashboard/files?folder=${targetFolderId}`)
    } else {
      router.push('/dashboard/files')
    }
  }

  const handleDragStart = (e: DragEvent, file: any) => {
    const data = e.dataTransfer.getData('application/json')
    if (data) {
      const { file: draggedFile, isSelected } = JSON.parse(data)
      
      // If dragging a selected file, move all selected files
      if (isSelected && selectedFiles.length > 1) {
        const selectedItems = [...files, ...folders].filter(f => 
          selectedFiles.includes(f.id)
        )
        setDraggedFiles(selectedItems)
      } else {
        setDraggedFiles([draggedFile])
      }
    }
  }

  const handleDrop = async (e: DragEvent, targetFolder: any) => {
    e.preventDefault()
    
    if (!targetFolder.isFolder || draggedFiles.length === 0) return

    try {
      await Promise.all(
        draggedFiles.map((file: any) => 
          apiClient.post(`/files/${file.id}/move`, {
            parentId: targetFolder.id
          })
        )
      )

      toast({
        title: 'Success',
        description: `${draggedFiles.length} item(s) moved to ${targetFolder.name}`
      })

      await loadFiles()
      setDraggedFiles([])
      setSelectedFiles([])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to move files',
        variant: 'destructive'
      })
    }
  }

  // Global conflict dialog trigger
  useEffect(() => {
    const handler = (ev: any) => setConflictFile(ev.detail.file)
    window.addEventListener('open-conflict-dialog', handler as any)
    return () => window.removeEventListener('open-conflict-dialog', handler as any)
  }, [])

  if (loading) {
    return (
      <div className="h-full bg-background p-6">
        {viewMode === 'grid' ? <FileGridSkeleton /> : <FileListSkeleton />}
      </div>
    )
  }

  const hasContent = files.length > 0 || folders.length > 0

  return (
    <div className="h-full bg-background">
      {/* Action bar when files are selected */}
      {selectedFiles.length > 0 && (
        <div className="bg-secondary border-b border-border px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm">{selectedFiles.length} selected</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link className="h-4 w-4 mr-2" />
              Copy link
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => {
                const first = selectedFiles[0]
                if (!first) return
                // open manage access (share dialog) for first selected
                const file = [...files, ...folders].find(f => (f.id || f._id) === first)
                if (file) setShareFile(file)
              }}
            >
              <Link className="h-4 w-4 mr-2" />
              Manage access
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setDeleteFiles(
                [...files, ...folders].filter(f => selectedFiles.includes(f.id))
              )}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Move className="h-4 w-4 mr-2" />
              Move to
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Copy className="h-4 w-4 mr-2" />
              Copy to
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => {
                const selected = [...files, ...folders].find(f => 
                  selectedFiles.includes(f.id) && selectedFiles.length === 1
                )
                if (selected) setRenameFile(selected)
              }}
              disabled={selectedFiles.length !== 1}
            >
              <FileText className="h-4 w-4 mr-2" />
              Rename
            </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedFiles([])}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="p-6">
        <div className="mb-6">
          <Breadcrumb
            folderId={folderId}
            onNavigate={handleNavigate}
          />
        </div>

      {!hasContent ? (
        <div className="flex h-full items-center justify-center">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-light text-muted-foreground mb-4">
              {folderId ? 'This folder is empty' : 'No files yet'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Upload files or create folders to get started
            </p>
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <FileGrid 
              files={files} 
              folders={folders}
              selectedFiles={selectedFiles}
              onFileSelect={setSelectedFiles}
              onFileClick={(file) => handleFileAction('open', file)}
              onDelete={(id) => {
                const file = files.find(f => (f.id || f._id) === id) || folders.find(f => (f.id || f._id) === id)
                if (file) handleFileAction('delete', file)
              }}
              onFavorite={(id) => {
                const file = files.find(f => (f.id || f._id) === id) || folders.find(f => (f.id || f._id) === id)
                if (file) handleFileAction('favorite', file)
              }}
          onShare={(id) => {
            const file = files.find(f => (f.id || f._id) === id) || folders.find(f => (f.id || f._id) === id)
            if (file) handleFileAction('share', file)
          }}
          onCopyLink={async (id) => {
            try {
              const res = await apiClient.post(`/files/${id}/share/link`, { permission: 'view' })
              const shareUrl = `${window.location.origin}/shared/${res.data.shareId}`
              await navigator.clipboard.writeText(shareUrl)
              toast({ title: 'Link copied', description: 'Share link copied to clipboard' })
            } catch (e) {
              toast({ title: 'Error', description: 'Failed to create link', variant: 'destructive' })
            }
          }}
              onDownload={(id) => {
                const file = files.find(f => (f.id || f._id) === id)
                if (file) handleFileAction('download', file)
              }}
              onRename={(id) => {
                const file = files.find(f => (f.id || f._id) === id) || folders.find(f => (f.id || f._id) === id)
                if (file) handleFileAction('rename', file)
              }}
              onVersionHistory={(id) => {
                const file = files.find(f => (f.id || f._id) === id)
                if (file) handleFileAction('versions', file)
              }}
          onManageAccess={(id) => {
            const file = files.find(f => (f.id || f._id) === id)
            if (file) handleFileAction('share', file)
          }}
          onDetails={(id) => {
            const file = files.find(f => (f.id || f._id) === id) || folders.find(f => (f.id || f._id) === id)
            if (file) handleFileAction('details', file)
          }}
        />
          ) : (
            <FileList 
              files={files}
              folders={folders}
              selectedFiles={selectedFiles}
              onFileSelect={setSelectedFiles}
              onFileClick={(file) => handleFileAction('open', file)}
              onDelete={(id) => {
                const file = files.find(f => (f.id || f._id) === id) || folders.find(f => (f.id || f._id) === id)
                if (file) handleFileAction('delete', file)
              }}
              onFavorite={(id) => {
                const file = files.find(f => (f.id || f._id) === id) || folders.find(f => (f.id || f._id) === id)
                if (file) handleFileAction('favorite', file)
              }}
          onShare={(id) => {
            const file = files.find(f => (f.id || f._id) === id) || folders.find(f => (f.id || f._id) === id)
            if (file) handleFileAction('share', file)
          }}
          onCopyLink={async (id) => {
            try {
              const res = await apiClient.post(`/files/${id}/share/link`, { permission: 'view' })
              const shareUrl = `${window.location.origin}/shared/${res.data.shareId}`
              await navigator.clipboard.writeText(shareUrl)
              toast({ title: 'Link copied', description: 'Share link copied to clipboard' })
            } catch (e) {
              toast({ title: 'Error', description: 'Failed to create link', variant: 'destructive' })
            }
          }}
              onDownload={(id) => {
                const file = files.find(f => (f.id || f._id) === id)
                if (file) handleFileAction('download', file)
              }}
              onRename={(id) => {
                const file = files.find(f => (f.id || f._id) === id) || folders.find(f => (f.id || f._id) === id)
                if (file) handleFileAction('rename', file)
              }}
              onVersionHistory={(id) => {
                const file = files.find(f => (f.id || f._id) === id)
                if (file) handleFileAction('versions', file)
              }}
              onManageAccess={(id) => {
                const file = files.find(f => (f.id || f._id) === id)
                if (file) handleFileAction('share', file)
              }}
              onDetails={(id) => {
                const file = files.find(f => (f.id || f._id) === id) || folders.find(f => (f.id || f._id) === id)
                if (file) handleFileAction('details', file)
              }}
            />
          )}
        </>
      )}
      </div>
      
      {/* Rename Dialog */}
      {renameFile && (
        <RenameDialog
          open={!!renameFile}
          onOpenChange={(open) => {
            if (!open) {
              setRenameFile(null)
              loadFiles()
            }
          }}
          file={renameFile}
        />
      )}
      
      {/* Delete Dialog */}
      {deleteFiles.length > 0 && (
        <DeleteDialog
          open={deleteFiles.length > 0}
          onOpenChange={(open) => !open && setDeleteFiles([])}
          files={deleteFiles}
          onComplete={loadFiles}
        />
      )}
      
      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          open={!!previewFile}
          onOpenChange={(open) => !open && setPreviewFile(null)}
          onDownload={() => handleFileAction('download', previewFile)}
          onShare={() => handleFileAction('share', previewFile)}
          onDelete={() => {
            setPreviewFile(null)
            handleFileAction('delete', previewFile)
          }}
        />
      )}
      
      {/* Share Dialog */}
      {shareFile && (
        <ShareDialog
          file={shareFile}
          open={!!shareFile}
          onOpenChange={(open) => !open && setShareFile(null)}
        />
      )}
      {detailsFile && (
        <DetailsPanel file={detailsFile} isOpen={!!detailsFile} onClose={() => setDetailsFile(null)} />
      )}
      {conflictFile && (
        <ConflictDialog
          file={conflictFile}
          open={!!conflictFile}
          onOpenChange={(open) => !open && setConflictFile(null)}
        />
      )}
      {versionFile && (
        <VersionHistory
          file={versionFile}
          open={!!versionFile}
          onOpenChange={(open) => !open && setVersionFile(null)}
        />
      )}
    </div>
  )
}
