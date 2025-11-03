'use client'

import { 
  Upload, 
  FolderPlus, 
  Download, 
  Share2, 
  Trash2, 
  Copy, 
  Move, 
  Info,
  MoreHorizontal,
  SortAsc,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'

interface CommandBarProps {
  selectedCount: number
  onUpload: () => void
  onNewFolder: () => void
  onDownload: () => void
  onShare: () => void
  onDelete: () => void
  onMove: () => void
  onCopy: () => void
  onDetails: () => void
}

export function CommandBar({
  selectedCount,
  onUpload,
  onNewFolder,
  onDownload,
  onShare,
  onDelete,
  onMove,
  onCopy,
  onDetails,
}: CommandBarProps) {
  const hasSelection = selectedCount > 0

  return (
    <div className="command-bar flex items-center gap-1">
      {/* Primary actions */}
      <Button
        variant="ghost"
        size="sm"
        className="command-button"
        onClick={onUpload}
      >
        <Upload className="mr-2 h-4 w-4" />
        Upload
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="command-button"
        onClick={onNewFolder}
      >
        <FolderPlus className="mr-2 h-4 w-4" />
        New folder
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Selection-based actions */}
      <Button
        variant="ghost"
        size="sm"
        className="command-button"
        disabled={!hasSelection}
        onClick={onShare}
      >
        <Share2 className="mr-2 h-4 w-4" />
        Share
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="command-button"
        disabled={!hasSelection}
        onClick={onCopy}
      >
        <Copy className="mr-2 h-4 w-4" />
        Copy
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="command-button"
        disabled={!hasSelection}
        onClick={onMove}
      >
        <Move className="mr-2 h-4 w-4" />
        Move
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="command-button"
        disabled={!hasSelection}
        onClick={onDownload}
      >
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="command-button"
        disabled={!hasSelection}
        onClick={onDelete}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Secondary actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="command-button">
            <SortAsc className="mr-2 h-4 w-4" />
            Sort
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Name</DropdownMenuItem>
          <DropdownMenuItem>Date modified</DropdownMenuItem>
          <DropdownMenuItem>Size</DropdownMenuItem>
          <DropdownMenuItem>Type</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="sm"
        className="command-button"
      >
        <Filter className="mr-2 h-4 w-4" />
        Filter
      </Button>

      <div className="flex-1" />

      {/* Right side actions */}
      {hasSelection && (
        <span className="text-sm text-muted-foreground">
          {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
        </span>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="command-button"
        onClick={onDetails}
        disabled={!hasSelection}
      >
        <Info className="mr-2 h-4 w-4" />
        Details
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Refresh</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Help</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}