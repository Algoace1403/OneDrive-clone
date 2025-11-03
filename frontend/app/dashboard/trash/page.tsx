'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { FileGrid } from '@/components/files/file-grid'
import { FileList } from '@/components/files/file-list'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2, RotateCcw, Trash } from 'lucide-react'
import { toast } from '@/lib/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function TrashPage() {
  const viewMode = 'grid' // Default view mode
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['files', 'deleted'],
    queryFn: async () => {
      const response = await apiClient.get('/files/trash')
      return response.data
    },
  })

  const restoreMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await apiClient.post(`/files/${fileId}/restore`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      toast({
        title: 'File restored',
        description: 'File has been restored successfully',
      })
    },
  })

  const permanentDeleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await apiClient.delete(`/files/${fileId}/permanent`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      toast({
        title: 'File deleted',
        description: 'File has been permanently deleted',
      })
    },
  })

  const emptyTrashMutation = useMutation({
    mutationFn: async () => {
      const deletePromises = data.files.map((file: any) =>
        apiClient.delete(`/files/${file._id}/permanent`)
      )
      await Promise.all(deletePromises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      toast({
        title: 'Trash emptied',
        description: 'All files have been permanently deleted',
      })
    },
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const handleRestore = (fileId: string) => {
    restoreMutation.mutate(fileId)
  }

  const handlePermanentDelete = (fileId: string) => {
    permanentDeleteMutation.mutate(fileId)
  }

  const deletedFiles = data?.files || []
  const folders = deletedFiles.filter((f: any) => f.isFolder)
  const files = deletedFiles.filter((f: any) => !f.isFolder)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trash2 className="h-6 w-6" />
          Trash
        </h1>
        
        {deletedFiles.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="mr-2 h-4 w-4" />
                Empty Trash
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Empty trash?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All files in the trash will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => emptyTrashMutation.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Empty Trash
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {deletedFiles.length === 0 ? (
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <Trash2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Trash is empty</p>
            <p className="text-sm text-muted-foreground">
              Deleted files will appear here for 30 days
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Items in trash will be permanently deleted after 30 days
          </p>
          
          {viewMode === 'grid' ? (
            <FileGrid
              files={files}
              folders={folders}
              selectedFiles={selectedFiles}
              onFileSelect={setSelectedFiles}
              onFileClick={() => {}}
              onDelete={handlePermanentDelete}
              onFavorite={() => {}}
              onShare={() => {}}
              onDownload={() => {}}
            />
          ) : (
            <FileList
              files={files}
              folders={folders}
              selectedFiles={selectedFiles}
              onFileSelect={setSelectedFiles}
              onFileClick={() => {}}
              onDelete={handlePermanentDelete}
              onFavorite={() => {}}
              onShare={() => {}}
              onDownload={() => {}}
            />
          )}
        </div>
      )}
    </div>
  )
}
