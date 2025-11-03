'use client'

import { useState, useEffect, useRef } from 'react'
import { FileGrid } from '@/components/files/file-grid'
import { FileList } from '@/components/files/file-list'
import { RenameDialog } from '@/components/files/rename-dialog'
import { DeleteDialog } from '@/components/files/delete-dialog'
import { FilePreviewModal } from '@/components/preview/file-preview-modal'
import { ShareDialog } from '@/components/share/share-dialog'
import { DetailsPanel } from '@/components/layout/details-panel'
import { apiClient } from '@/lib/api/client'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/hooks/use-toast'
import { useViewMode } from '@/lib/contexts/view-mode-context'
import { useSocket } from '@/lib/hooks/use-socket'
import { useSearch } from '@/lib/contexts/search-context'
import { VersionHistory } from '@/components/files/version-history'
import { FileGridSkeleton } from '@/components/files/file-grid-skeleton'
import { FileListSkeleton } from '@/components/files/file-list-skeleton'

export default function DashboardPage() {
  const { viewMode } = useViewMode()
  const router = useRouter()
  const { socket } = useSocket()
  const { query: searchQuery, filters, sort } = useSearch()
  const reqController = useRef<AbortController | null>(null)
  const [files, setFiles] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [renameFile, setRenameFile] = useState<any>(null)
  const [deleteFiles, setDeleteFiles] = useState<any[]>([])
  const [previewFile, setPreviewFile] = useState<any>(null)
  const [shareFile, setShareFile] = useState<any>(null)
  const [detailsFile, setDetailsFile] = useState<any>(null)
  const [versionFile, setVersionFile] = useState<any>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      loadFiles()
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

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
      
      if (reqController.current) reqController.current.abort()
      reqController.current = new AbortController()
      const signal = reqController.current.signal

      if (searchQuery) {
        let endpoint = `/files/search?q=${encodeURIComponent(searchQuery)}`
        if (filters?.type && filters.type !== 'all') endpoint += `&type=${filters.type}`
        if (filters?.owner && filters.owner !== 'all') endpoint += `&owner=${filters.owner}`
        if (filters?.syncStatus && filters.syncStatus !== 'all') endpoint += `&status=${filters.syncStatus}`
        if (sort) endpoint += `&sort=${sort.field}&direction=${sort.direction}`
        const response = await apiClient.get(endpoint, { signal }).catch((e) => {
          if (e.name === 'CanceledError' || e.code === 'ERR_CANCELED') return { data: {} }
          throw e
        })
        const items = response.data.files || []
        // Annotate with share counts and favorites for Sharing column and stars
        const ids = items.map((i: any) => i.id || i._id).filter(Boolean)
        let counts: Record<string, number> = {}
        let favs: Record<string, boolean> = {}
        if (ids.length > 0) {
          const meta = await apiClient.get(`/files/meta?ids=${ids.join(',')}`, { signal }).catch(() => ({ data: { counts: {}, favorites: {} } }))
          counts = meta.data?.counts || {}
          favs = meta.data?.favorites || {}
        }
        const annotated = items.map((i: any) => ({ ...i, sharedCount: counts[i.id || i._id] || 0, isFavorite: !!favs[i.id || i._id] }))
        setFiles(annotated)
        setFolders([])
      } else {
        // Load recent files
        const response = await apiClient.get('/files/recent?limit=10', { signal }).catch((e) => {
          if (e.name === 'CanceledError' || e.code === 'ERR_CANCELED') return { data: {} }
          throw e
        })
        const items = response.data.files || []
        const ids = items.map((i: any) => i.id || i._id).filter(Boolean)
        let counts: Record<string, number> = {}
        let favs: Record<string, boolean> = {}
        if (ids.length > 0) {
          const meta = await apiClient.get(`/files/meta?ids=${ids.join(',')}`, { signal }).catch(() => ({ data: { counts: {}, favorites: {} } }))
          counts = meta.data?.counts || {}
          favs = meta.data?.favorites || {}
        }
        const annotated = items.map((i: any) => ({ ...i, sharedCount: counts[i.id || i._id] || 0, isFavorite: !!favs[i.id || i._id] }))
        setFiles(annotated)
        setFolders([])
      }
    } catch (error) {
      console.error('Error loading files:', error)
      setFiles([])
      setFolders([])
    } finally {
      setLoading(false)
    }
  }

  const handleFileAction = async (action: string, file: any) => {
    console.log('handleFileAction:', action, 'file:', file);
    switch (action) {
      case 'open':
        if (file.isFolder) {
          // Navigate to folder (client-side)
          const folderId = file.id || file._id;
          router.push(`/dashboard/files?folder=${folderId}`)
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
        const prev = files
        setFiles((cur) => cur.map((f) => (f.id === favoriteId || (f as any)._id === favoriteId ? { ...f, isFavorite: !f.isFavorite } : f)))
        try {
          await apiClient.patch(`/files/${favoriteId}/favorite`)
          toast({
            title: 'Success',
            description: file.isFavorite ? 'Removed from favorites' : 'Added to favorites'
          })
        } catch (error) {
          setFiles(prev)
          toast({
            title: 'Error',
            description: 'Failed to update favorite status',
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

  if (loading) {
    return (
      <div className="h-full bg-background p-6">
        {viewMode === 'grid' ? <FileGridSkeleton /> : <FileListSkeleton />}
      </div>
    )
  }

  const hasContent = files.length > 0 || folders.length > 0

  if (!hasContent) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-light text-muted-foreground mb-8">
            Your recent files will show up here
          </h2>
          
          {/* Empty state illustration */}
          <div className="relative w-64 h-64 mx-auto mb-8">
          <img 
              src="/image/img5.webp" 
              alt="Microsoft OneDrive Interface"
              className="w-full h-auto rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-background p-6">
      <div className="mb-4">
        <h2 className="text-xl font-light text-gray-300">Recent</h2>
      </div>
      
      {viewMode === 'grid' ? (
        <FileGrid 
          files={files} 
          folders={folders}
          selectedFiles={selectedFiles}
          onFileSelect={setSelectedFiles}
          onFileClick={(file) => handleFileAction('open', file)}
          onDelete={(id) => {
            const file = files.find(f => (f.id === id || f._id === id)) || folders.find(f => (f.id === id || f._id === id))
            if (file) {
              // Ensure file has id property
              file.id = file.id || file._id
              handleFileAction('delete', file)
            }
          }}
          onFavorite={(id) => {
            const file = files.find(f => (f.id === id || f._id === id)) || folders.find(f => (f.id === id || f._id === id))
            if (file) {
              file.id = file.id || file._id
              handleFileAction('favorite', file)
            }
          }}
          onShare={(id) => {
            const file = files.find(f => (f.id === id || f._id === id)) || folders.find(f => (f.id === id || f._id === id))
            if (file) {
              file.id = file.id || file._id
              handleFileAction('share', file)
            }
          }}
          onCopyLink={async (id) => {
            const file = files.find(f => (f.id === id || f._id === id))
            if (!file) return
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
            const file = files.find(f => (f.id === id || f._id === id))
            if (file) {
              file.id = file.id || file._id
              handleFileAction('download', file)
            }
          }}
          onRename={(id) => {
            const file = files.find(f => (f.id === id || f._id === id)) || folders.find(f => (f.id === id || f._id === id))
            if (file) {
              file.id = file.id || file._id
              handleFileAction('rename', file)
            }
          }}
          onManageAccess={(id) => {
            const file = files.find(f => (f.id === id || f._id === id))
            if (file) {
              file.id = file.id || file._id
              handleFileAction('share', file)
            }
          }}
          onDetails={(id) => {
            const file = files.find(f => (f.id === id || f._id === id)) || folders.find(f => (f.id === id || f._id === id))
            if (file) {
              file.id = file.id || file._id
              handleFileAction('details', file)
            }
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
            const file = files.find(f => (f.id === id || f._id === id)) || folders.find(f => (f.id === id || f._id === id))
            if (file) {
              // Ensure file has id property
              file.id = file.id || file._id
              handleFileAction('delete', file)
            }
          }}
          onFavorite={(id) => {
            const file = files.find(f => (f.id === id || f._id === id)) || folders.find(f => (f.id === id || f._id === id))
            if (file) {
              file.id = file.id || file._id
              handleFileAction('favorite', file)
            }
          }}
          onShare={(id) => {
            const file = files.find(f => (f.id === id || f._id === id)) || folders.find(f => (f.id === id || f._id === id))
            if (file) {
              file.id = file.id || file._id
              handleFileAction('share', file)
            }
          }}
          onDownload={(id) => {
            const file = files.find(f => (f.id === id || f._id === id))
            if (file) {
              file.id = file.id || file._id
              handleFileAction('download', file)
            }
          }}
          onRename={(id) => {
            const file = files.find(f => (f.id === id || f._id === id)) || folders.find(f => (f.id === id || f._id === id))
            if (file) {
              file.id = file.id || file._id
              handleFileAction('rename', file)
            }
          }}
          onVersionHistory={(id) => {
            const file = files.find(f => (f.id === id || f._id === id))
            if (file) {
              file.id = file.id || file._id
              handleFileAction('versions', file)
            }
          }}
        />
      )}
      
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
          onComplete={() => {
            setDeleteFiles([])
            loadFiles()
          }}
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
