import { Folder, Share2, Star, Trash2, MoreVertical, FileText, Link } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface FolderRowProps {
  folder: any
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onClick: () => void
  onDelete: () => void
  onFavorite: () => void
  onShare: () => void
  onRename?: () => void
}

export function FolderRow({
  folder,
  isSelected,
  onSelect,
  onClick,
  onDelete,
  onFavorite,
  onShare,
  onRename,
}: FolderRowProps) {
  const sharer: any = (folder as any).shared_by
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
    <tr
      className={cn(
        'hover:bg-accent cursor-pointer transition-colors',
        isSelected && 'bg-accent'
      )}
      onClick={onClick}
    >
      <td className="p-3" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          className="w-4 h-4"
        />
      </td>
      <td className="p-0" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(); }}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link className="mr-2 h-4 w-4" />
              Copy link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onFavorite(); }}>
              <Star className={cn("mr-2 h-4 w-4", folder.isFavorite && "fill-current")} />
              {folder.isFavorite ? 'Unfavorite' : 'Favorite'}
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
      </td>
      <td className="p-3">
        <div className="flex items-center gap-3">
          <Folder className="h-5 w-5 text-[#ffc83d] flex-shrink-0" />
          <span className="truncate">{folder.name}</span>
          {folder.isFavorite && (
            <Star className="h-3 w-3 fill-current text-yellow-500 flex-shrink-0" />
          )}
        </div>
      </td>
      <td className="p-3 text-muted-foreground">
        {formatDate(folder.updatedAt || folder.updated_at)}
      </td>
      <td className="p-3 text-muted-foreground">
        --
      </td>
      <td className="p-3 text-muted-foreground">
        {sharerLabel ? (
          <span className="inline-flex items-center gap-2">
            <span
              className="h-5 w-5 rounded-full text-white text-[10px] inline-flex items-center justify-center"
              style={{ backgroundColor: `hsl(${sharerHue} 70% 40%)` }}
              title={sharerLabel}
            >
              {sharerInitials}
            </span>
            <span>{`Shared by ${sharer?.name || sharer?.email}`}</span>
          </span>
        ) : ((folder as any).sharedCount && (folder as any).sharedCount > 0) ? (
          <span className="inline-flex items-center gap-1">
            <span className="h-4 w-4 rounded-full bg-[hsl(var(--primary))/0.2]" />
            <span>{`Shared (${(folder as any).sharedCount})`}</span>
          </span>
        ) : 'Private'}
      </td>
    </tr>
  )
}
