'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { apiClient } from '@/lib/api/client'
import { toast } from '@/lib/hooks/use-toast'

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  files: any[]
  permanent?: boolean
  onComplete?: () => void
}

export function DeleteDialog({ open, onOpenChange, files, permanent = false, onComplete }: DeleteDialogProps) {
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const handleDelete = async () => {
    setLoading(true)
    
    try {
      await Promise.all(
        files.map(file => 
          permanent 
            ? apiClient.delete(`/files/${file.id}/permanent`)
            : apiClient.delete(`/files/${file.id}`)
        )
      )

      toast({
        title: 'Success',
        description: permanent 
          ? `${files.length} item(s) permanently deleted`
          : `${files.length} item(s) moved to recycle bin`
      })

      queryClient.invalidateQueries({ queryKey: ['files'] })
      queryClient.invalidateQueries({ queryKey: ['trash'] })
      onOpenChange(false)
      onComplete?.()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete files',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            {permanent ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <Trash2 className="h-5 w-5" />
            )}
            <DialogTitle>
              {permanent ? 'Permanently Delete' : 'Delete'} {files.length === 1 ? 'Item' : 'Items'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {permanent ? (
              <>
                Are you sure you want to permanently delete {files.length} {files.length === 1 ? 'item' : 'items'}? 
                This action cannot be undone.
              </>
            ) : (
              <>
                Are you sure you want to delete {files.length} {files.length === 1 ? 'item' : 'items'}? 
                You can restore {files.length === 1 ? 'it' : 'them'} from the recycle bin later.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        
        {files.length > 0 && (
          <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
            {files.map(file => (
              <div key={file.id} className="text-sm p-1">
                {file.isFolder ? '📁' : '📄'} {file.name}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant={permanent ? 'destructive' : 'default'}
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : (permanent ? 'Delete Permanently' : 'Delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}