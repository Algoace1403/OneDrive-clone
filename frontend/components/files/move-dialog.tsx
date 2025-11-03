'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { FolderOpen, ChevronRight, Loader2 } from 'lucide-react'
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
import { cn } from '@/lib/utils'

interface MoveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  files: any[]
}

interface FolderTreeItem {
  id: string
  name: string
  parentId: string | null
  children: FolderTreeItem[]
  expanded?: boolean
}

export function MoveDialog({ open, onOpenChange, files }: MoveDialogProps) {
  const [loading, setLoading] = useState(false)
  const [folders, setFolders] = useState<FolderTreeItem[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [moving, setMoving] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (open) {
      loadFolders()
    }
  }, [open])

  const loadFolders = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get('/files?type=folder')
      const allFolders = response.data.files.filter((f: any) => f.isFolder)
      
      // Filter out the folders being moved to prevent moving into themselves
      const fileIds = files.map(f => f.id)
      const availableFolders = allFolders.filter((f: any) => !fileIds.includes(f.id))
      
      // Build folder tree
      const tree = buildFolderTree(availableFolders)
      setFolders(tree)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load folders',
        variant: 'destructive'
      })
    }
    setLoading(false)
  }

  const buildFolderTree = (folders: any[]): FolderTreeItem[] => {
    const folderMap = new Map<string, FolderTreeItem>()
    const rootFolders: FolderTreeItem[] = []

    // Create folder items
    folders.forEach(folder => {
      folderMap.set(folder.id, {
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        children: []
      })
    })

    // Build tree structure
    folders.forEach(folder => {
      const item = folderMap.get(folder.id)!
      if (folder.parentId && folderMap.has(folder.parentId)) {
        folderMap.get(folder.parentId)!.children.push(item)
      } else {
        rootFolders.push(item)
      }
    })

    return rootFolders
  }

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const handleMove = async () => {
    if (!selectedFolder && selectedFolder !== null) return

    setMoving(true)
    try {
      await Promise.all(
        files.map(file => 
          apiClient.post(`/files/${file.id}/move`, {
            parentId: selectedFolder
          })
        )
      )

      toast({
        title: 'Success',
        description: `${files.length} item(s) moved successfully`
      })

      queryClient.invalidateQueries({ queryKey: ['files'] })
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to move files',
        variant: 'destructive'
      })
    }
    setMoving(false)
  }

  const renderFolder = (folder: FolderTreeItem, level: number = 0): JSX.Element => {
    const hasChildren = folder.children.length > 0
    const isExpanded = expandedFolders.has(folder.id)
    const isSelected = selectedFolder === folder.id

    return (
      <div key={folder.id}>
        <div
          className={cn(
            "flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer",
            isSelected && "bg-accent"
          )}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => setSelectedFolder(folder.id)}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleFolder(folder.id)
              }}
            >
              <ChevronRight 
                className={cn(
                  "h-3 w-3 transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            </Button>
          )}
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{folder.name}</span>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {folder.children.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Move {files.length} item(s)</DialogTitle>
          <DialogDescription>
            Select a destination folder
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="border rounded-lg p-2 max-h-96 overflow-y-auto">
            <div
              className={cn(
                "flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer",
                selectedFolder === null && "bg-accent"
              )}
              onClick={() => setSelectedFolder(null)}
            >
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">My Files (Root)</span>
            </div>
            {folders.map(folder => renderFolder(folder))}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={moving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={moving || loading}
          >
            {moving ? 'Moving...' : 'Move'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}