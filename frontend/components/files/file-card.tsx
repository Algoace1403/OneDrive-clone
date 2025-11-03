import { useState, DragEvent } from 'react'
import { FileText, Download, Share2, Star, Trash2, MoreVertical, Move, Users } from 'lucide-react'
import { cn, formatBytes, getFileIcon, getFileTypeColor } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import * as Icons from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FileCardProps {
  file: any
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onClick: () => void
  onDelete: () => void
  onFavorite: () => void
  onShare: () => void
  onManageAccess?: () => void
  onCopyLink?: () => void
  onDownload: () => void
  onDetails?: () => void
  onRename?: () => void
  onVersionHistory?: () => void
  onDragStart?: (e: DragEvent) => void
  onDragEnd?: (e: DragEvent) => void
  onDragOver?: (e: DragEvent) => void
  onDrop?: (e: DragEvent) => void
}

export function FileCard({
  file,
  isSelected,
  onSelect,
  onClick,
  onDelete,
  onFavorite,
  onShare,
  onManageAccess,
  onCopyLink,
  onDownload,
  onDetails,
  onRename,
  onVersionHistory,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: FileCardProps) {
  const router = useRouter()
  const [showCheckbox, setShowCheckbox] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const iconName = getFileIcon(file.name)
  const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<any> || FileText
  const colorClass = getFileTypeColor(file.name)
  const sharer: any = (file as any)?.shared_by
  const sharerLabel = sharer?.name || sharer?.email || ''
  const sharerInitials = sharerLabel
    ? sharerLabel
        .split(/\s+/)
        .map((p: string) => p.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('')
    : ''
  const sharerHue = (() => {
    const s = sharerLabel || 'shared'
    let h = 0
    for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h)
    return Math.abs(h) % 360
  })()

  const handleDragStart = (e: DragEvent) => {
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/json', JSON.stringify({ file, isSelected }))
    onDragStart?.(e)
  }

  const handleDragEnd = (e: DragEvent) => {
    setIsDragging(false)
    setIsDragOver(false)
    onDragEnd?.(e)
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (file.isFolder) {
      setIsDragOver(true)
    }
    onDragOver?.(e)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (file.isFolder) {
      onDrop?.(e)
    }
  }

  return (
    <div
      className={cn(
        'group relative rounded border border-transparent p-3 hover:border-border hover:shadow-sm cursor-pointer transition-all file-tile',
        isSelected && 'file-tile selected',
        isDragging && 'opacity-50',
        isDragOver && 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))/0.1]'
      )}
      onMouseEnter={() => setShowCheckbox(true)}
      onMouseLeave={() => !isSelected && setShowCheckbox(false)}
      onClick={onClick}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {(showCheckbox || isSelected) && (
        <div
          className="absolute left-2 top-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
          />
        </div>
      )}

      <div className="absolute right-2 top-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(); }}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(); }}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            {(file?.name?.match(/\.(docx?|xlsx?|pptx?)$/i)) && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/editor/${file.id || file._id}`) }}>
                <FileText className="mr-2 h-4 w-4" />
                Open in Web Editor (mock)
              </DropdownMenuItem>
            )}
            {file?.syncStatus === 'error' && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); const ev = new CustomEvent('open-conflict-dialog', { detail: { file } }); window.dispatchEvent(ev) }}>
                <Move className="mr-2 h-4 w-4" />
                Resolve conflict
              </DropdownMenuItem>
            )}
            {onCopyLink && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopyLink(); }}>
                <Move className="mr-2 h-4 w-4" />
                Copy link
              </DropdownMenuItem>
            )}
            {onDetails && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDetails(); }}>
                <FileText className="mr-2 h-4 w-4" />
                Details
              </DropdownMenuItem>
            )}
            {onVersionHistory && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onVersionHistory(); }}>
                <History className="mr-2 h-4 w-4" />
                Version history
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={async (e) => {
              e.stopPropagation();
              try {
                if (file.metadata?.offline_available) {
                  const { apiClient } = await import('@/lib/api/client')
                  const { toast } = await import('@/lib/hooks/use-toast')
                  await apiClient.delete(`/offline/cache/${file.id || file._id}`)
                  toast({ title: 'Offline removed' })
                } else {
                  const { apiClient } = await import('@/lib/api/client')
                  const { toast } = await import('@/lib/hooks/use-toast')
                  await apiClient.post(`/offline/cache/${file.id || file._id}`)
                  toast({ title: 'Available offline' })
                }
              } catch {}
            }}>
              <Move className="mr-2 h-4 w-4" />
              {file.metadata?.offline_available ? 'Remove offline' : 'Make available offline'}
            </DropdownMenuItem>
            {onManageAccess && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onManageAccess(); }}>
                <MoreVertical className="mr-2 h-4 w-4" />
                Manage access
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onFavorite(); }}>
              <Star className={cn("mr-2 h-4 w-4", file.isFavorite && "fill-current")} />
              {file.isFavorite ? 'Unfavorite' : 'Favorite'}
            </DropdownMenuItem>
            {onRename && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}>
                <FileText className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="h-20 w-20 flex items-center justify-center">
          <IconComponent className={cn("h-12 w-12", colorClass)} />
        </div>
        <div className="w-full text-center px-2">
          <p className="text-xs font-medium line-clamp-2">
            {file.name}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {file.isFolder ? 'Folder' : formatBytes(file.size || 0)}
          </p>
        </div>
      </div>

      {file?.syncStatus && file.syncStatus !== 'synced' && (
        <span className={cn('absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded', file.syncStatus === 'syncing' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300')}>
          {file.syncStatus}
        </span>
      )}
      {file?.metadata?.offline_available && (
        <span className="absolute bottom-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-green-600/20 text-green-300">offline</span>
      )}
      {(((file as any).shared_by && ((file as any).shared_by.name || (file as any).shared_by.email)) || (file as any).sharedCount > 0) && (
        <span className="absolute bottom-2 right-8 text-[10px] px-1 py-0.5 rounded bg-[hsl(var(--primary))/0.10] text-[hsl(var(--primary))] inline-flex items-center gap-1">
          {sharerInitials ? (
            <span
              className="h-4 w-4 rounded-full text-white inline-flex items-center justify-center"
              style={{ backgroundColor: `hsl(${sharerHue} 70% 40%)` }}
              title={sharerLabel}
            >
              {sharerInitials}
            </span>
          ) : (
            <Users className="h-3 w-3" />
          )}
          Shared
        </span>
      )}

      {file.isFavorite && (
        <Star className="absolute bottom-2 right-2 h-3 w-3 fill-current text-yellow-500" />
      )}
    </div>
  )
}
