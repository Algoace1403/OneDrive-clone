'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api/client'
import { FileGrid } from '@/components/files/file-grid'
import { FileList } from '@/components/files/file-list'
import { Loader2, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useViewMode } from '@/lib/contexts/view-mode-context'
import { toast } from '@/lib/hooks/use-toast'
import { FilePreviewModal } from '@/components/preview/file-preview-modal'
import { ShareDialog } from '@/components/share/share-dialog'
import { DeleteDialog } from '@/components/files/delete-dialog'
import { RenameDialog } from '@/components/files/rename-dialog'
import { FileGridSkeleton } from '@/components/files/file-grid-skeleton'
import { FileListSkeleton } from '@/components/files/file-list-skeleton'
import { useFavoritesList } from '@/lib/queries/files'
import { useQueryClient } from '@tanstack/react-query'

export default function FavoritesPage() {
  const { viewMode } = useViewMode()
  const router = useRouter()
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const favoritesQuery = useFavoritesList()
  const queryClient = useQueryClient()
  const [previewFile, setPreviewFile] = useState<any>(null)
  const [shareFile, setShareFile] = useState<any>(null)
  const [deleteFiles, setDeleteFiles] = useState<any[]>([])
  const [renameFile, setRenameFile] = useState<any>(null)

  useEffect(() => {
    if (favoritesQuery.data) setFavorites(favoritesQuery.data)
  }, [favoritesQuery.data])

  if (favoritesQuery.isLoading) {
    return (
      <div className="h-full bg-background p-6">
        {viewMode === 'grid' ? <FileGridSkeleton /> : <FileListSkeleton />}
      </div>
    )
  }

  const handleFileAction = async (action: string, file: any) => {
    switch (action) {
      case 'open':
        if (file.isFolder) {
          router.push(`/dashboard/files?folder=${file.id || file._id}`)
        } else {
          setPreviewFile(file)
        }
        break
      
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
      
      case 'delete':
        setDeleteFiles([file])
        break
      
      case 'rename':
        setRenameFile(file)
        break
      
      case 'favorite':
        try {
          const favoriteId = file.id || file._id
          const prev = favorites
          // optimistic remove
          setFavorites((cur) => cur.filter(f => (f.id || f._id) !== favoriteId))
          await apiClient.patch(`/files/${favoriteId}/favorite`)
          toast({ title: 'Success', description: 'Removed from favorites' })
          queryClient.invalidateQueries({ queryKey: ['favorites-list'] })
        } catch (error) {
          // revert
          setFavorites((cur) => cur)
          toast({ title: 'Error', description: 'Failed to update favorite status', variant: 'destructive' })
        }
        break
      
      case 'share':
        setShareFile(file)
        break
    }
  }

  const folders = favorites.filter(f => f.isFolder)
  const files = favorites.filter(f => !f.isFolder)

  return (
    <div className="h-full bg-[#0c0c0c] p-6">
      <div className="mb-4">
        <h2 className="text-xl font-light text-gray-300 flex items-center gap-2">
          <Star className="h-5 w-5 fill-current text-yellow-500" />
          Favorites
        </h2>
      </div>
      
      {favorites.length === 0 ? (
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <Star className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No favorites yet</p>
            <p className="text-sm text-muted-foreground">
              Star files and folders to add them here
            </p>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <FileGrid
          files={files}
          folders={folders}
          selectedFiles={selectedFiles}
          onFileSelect={setSelectedFiles}
          onFileClick={(file) => handleFileAction('open', file)}
          onDelete={(id) => {
            const file = [...files, ...folders].find(f => (f.id || f._id) === id)
            if (file) handleFileAction('delete', file)
          }}
          onFavorite={(id) => {
            const file = [...files, ...folders].find(f => (f.id || f._id) === id)
            if (file) handleFileAction('favorite', file)
          }}
          onShare={(id) => {
            const file = [...files, ...folders].find(f => (f.id || f._id) === id)
            if (file) handleFileAction('share', file)
          }}
          onDownload={(id) => {
            const file = files.find(f => (f.id || f._id) === id)
            if (file) handleFileAction('download', file)
          }}
          onRename={(id) => {
            const file = [...files, ...folders].find(f => (f.id || f._id) === id)
            if (file) handleFileAction('rename', file)
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
            const file = [...files, ...folders].find(f => (f.id || f._id) === id)
            if (file) handleFileAction('delete', file)
          }}
          onFavorite={(id) => {
            const file = [...files, ...folders].find(f => (f.id || f._id) === id)
            if (file) handleFileAction('favorite', file)
          }}
          onShare={(id) => {
            const file = [...files, ...folders].find(f => (f.id || f._id) === id)
            if (file) handleFileAction('share', file)
          }}
          onDownload={(id) => {
            const file = files.find(f => (f.id || f._id) === id)
            if (file) handleFileAction('download', file)
          }}
          onRename={(id) => {
            const file = [...files, ...folders].find(f => (f.id || f._id) === id)
            if (file) handleFileAction('rename', file)
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
      
      {/* Rename Dialog */}
      {renameFile && (
        <RenameDialog
          open={!!renameFile}
          onOpenChange={(open) => {
            if (!open) {
              setRenameFile(null)
              queryClient.invalidateQueries({ queryKey: ['favorites-list'] })
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
            queryClient.invalidateQueries({ queryKey: ['favorites-list'] })
          }}
        />
      )}
    </div>
  )
}
