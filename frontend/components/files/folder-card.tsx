import { useState } from 'react'
import { Folder, Share2, Star, Trash2, MoreVertical, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface FolderCardProps {
  folder: any
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onClick: () => void
  onDelete: () => void
  onFavorite: () => void
  onShare: () => void
  onManageAccess?: () => void
  onCopyLink?: () => void
}

export function FolderCard({
  folder,
  isSelected,
  onSelect,
  onClick,
  onDelete,
  onFavorite,
  onShare,
  onManageAccess,
  onCopyLink,
}: FolderCardProps) {
  const [showCheckbox, setShowCheckbox] = useState(false)
  const sharer: any = (folder as any)?.shared_by
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

  return (
    <div
      className={cn(
        'group relative rounded-lg border p-4 hover:bg-accent cursor-pointer transition-colors',
        isSelected && 'ring-2 ring-primary'
      )}
      onMouseEnter={() => setShowCheckbox(true)}
      onMouseLeave={() => !isSelected && setShowCheckbox(false)}
      onClick={onClick}
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
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(); }}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            {onCopyLink && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopyLink(); }}>
                <MoreVertical className="mr-2 h-4 w-4" />
                Copy link
              </DropdownMenuItem>
            )}
            {onManageAccess && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onManageAccess(); }}>
                <MoreVertical className="mr-2 h-4 w-4" />
                Manage access
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onFavorite(); }}>
              <Star className={cn("mr-2 h-4 w-4", folder.isFavorite && "fill-current")} />
              {folder.isFavorite ? 'Unfavorite' : 'Favorite'}
            </DropdownMenuItem>
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

      <div className="flex flex-col items-center justify-center space-y-2 pt-4">
        <Folder className="h-12 w-12 text-blue-600" />
        <div className="w-full text-center">
          <p className="truncate text-sm font-medium">{folder.name}</p>
        </div>
      </div>

      {folder.isFavorite && (
        <Star className="absolute bottom-2 right-2 h-3 w-3 fill-current text-yellow-500" />
      )}
      {(((folder as any).shared_by && ((folder as any).shared_by.name || (folder as any).shared_by.email)) || (folder as any).sharedCount > 0) && (
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
    </div>
  )
}
