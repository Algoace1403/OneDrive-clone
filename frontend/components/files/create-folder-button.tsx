'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { FolderPlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { apiClient } from '@/lib/api/client'
import { toast } from '@/lib/hooks/use-toast'

interface CreateFolderButtonProps {
  parentId: string | null
}

export function CreateFolderButton({ parentId }: CreateFolderButtonProps) {
  const [open, setOpen] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const handleCreate = async () => {
    if (!folderName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a folder name',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      await apiClient.post('/files/folder', {
        name: folderName.trim(),
        parentId,
      })

      queryClient.invalidateQueries({ queryKey: ['files'] })
      toast({
        title: 'Folder created',
        description: `"${folderName}" has been created successfully`,
      })
      
      setOpen(false)
      setFolderName('')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create folder',
        variant: 'destructive',
      })
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FolderPlus className="mr-2 h-4 w-4" />
          New Folder
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Enter a name for your new folder
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Folder name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
