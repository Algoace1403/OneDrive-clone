'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/lib/api/client'
import { toast } from '@/lib/hooks/use-toast'

interface RenameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: any
}

export function RenameDialog({ open, onOpenChange, file }: RenameDialogProps) {
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (file) {
      setNewName(file.name)
    }
  }, [file])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newName.trim()) {
      toast({
        title: 'Error',
        description: 'Name cannot be empty',
        variant: 'destructive'
      })
      return
    }

    if (newName === file.name) {
      onOpenChange(false)
      return
    }

    setLoading(true)
    
    try {
      await apiClient.patch(`/files/${file.id}/rename`, {
        name: newName.trim()
      })

      toast({
        title: 'Success',
        description: 'File renamed successfully'
      })

      queryClient.invalidateQueries({ queryKey: ['files'] })
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to rename file',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
            <DialogDescription>
              Enter a new name for this {file?.isFolder ? 'folder' : 'file'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3"
                placeholder="New name"
                autoFocus
                onFocus={(e) => {
                  // Select filename without extension
                  if (!file?.isFolder && file?.name.includes('.')) {
                    const extensionIndex = file.name.lastIndexOf('.')
                    e.target.setSelectionRange(0, extensionIndex)
                  } else {
                    e.target.select()
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Original name: {file?.name}</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || newName === file?.name}>
              {loading ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}