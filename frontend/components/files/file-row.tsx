import { FileText, Download, Share2, Star, Trash2, MoreVertical, Link, History, AlertTriangle, RefreshCcw } from 'lucide-react'
import { cn, formatBytes, formatDate, getFileIcon, getFileTypeColor } from '@/lib/utils'
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
import { apiClient } from '@/lib/api/client'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/hooks/use-toast'

interface FileRowProps {
  file: any
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onClick: () => void
  onDelete: () => void
  onFavorite: () => void
  onShare: () => void
  onDownload: () => void
  onRename?: () => void
  onVersionHistory?: () => void
  onManageAccess?: () => void
  onCopyLink?: () => void
  onDetails?: () => void
}

export function FileRow({
  file,
  isSelected,
  onSelect,
  onClick,
  onDelete,
  onFavorite,
  onShare,
  onDownload,
  onRename,
  onVersionHistory,
  onManageAccess,
  onCopyLink,
  onDetails,
}: FileRowProps) {
  const router = useRouter()
  const iconName = getFileIcon(file.name)
  const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<any> || FileText
  const colorClass = getFileTypeColor(file.name)
  const sharer: any = (file as any).shared_by || (file as any).sharedBy
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
        'hover:bg-accent cursor-pointer transition-colors border-b border-border',
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
            {(file.name?.match(/\.(docx?|xlsx?|pptx?)$/i)) && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/editor/${file.id || file._id}`) }}>
                <FileText className="mr-2 h-4 w-4" />
                Open in Web Editor (mock)
              </DropdownMenuItem>
            )}
            {file.syncStatus === 'error' && (
              <DropdownMenuItem onClick={async (e) => { e.stopPropagation(); const ev = new CustomEvent('open-conflict-dialog', { detail: { file } }); window.dispatchEvent(ev) }}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Resolve conflict
              </DropdownMenuItem>
            )}
            {onManageAccess && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onManageAccess(); }}>
                <Link className="mr-2 h-4 w-4" />
                Manage access
              </DropdownMenuItem>
            )}
            {onDetails && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDetails(); }}>
                <FileText className="mr-2 h-4 w-4" />
                Details
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <Link className="mr-2 h-4 w-4" />
              <span onClick={(e) => { e.stopPropagation(); onCopyLink?.() }}>Copy link</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={async (e) => {
              e.stopPropagation();
              try {
                if (file.metadata?.offline_available) {
                  await apiClient.delete(`/offline/cache/${file.id || file._id}`)
                  toast({ title: 'Offline removed' })
                } else {
                  await apiClient.post(`/offline/cache/${file.id || file._id}`)
                  toast({ title: 'Available offline', description: 'This item will be cached' })
                }
              } catch {
                toast({ title: 'Error', description: 'Failed to toggle offline', variant: 'destructive' })
              }
            }}>
              <Link className="mr-2 h-4 w-4" />
              {file.metadata?.offline_available ? 'Remove offline' : 'Make available offline'}
            </DropdownMenuItem>
          <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(); }}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={async (e) => { 
              e.stopPropagation(); 
              try {
                await apiClient.post(`/sync/simulate`, { ids: [file.id || file._id] })
                toast({ title: 'Sync started', description: 'Simulating sync...' })
              } catch { toast({ title: 'Error', description: 'Failed to start sync', variant: 'destructive' }) }
            }}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Sync now
            </DropdownMenuItem>
            <DropdownMenuItem onClick={async (e) => { 
              e.stopPropagation(); 
              try {
                await apiClient.post(`/sync/conflict/${file.id || file._id}`)
                toast({ title: 'Conflict simulated' })
              } catch { toast({ title: 'Error', description: 'Failed to simulate conflict', variant: 'destructive' }) }
            }}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Simulate conflict
            </DropdownMenuItem>
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
            {onVersionHistory && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onVersionHistory(); }}>
                <History className="mr-2 h-4 w-4" />
                Version history
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
          <IconComponent className={cn("h-5 w-5 flex-shrink-0", colorClass)} />
          <span className="truncate">{file.name}</span>
          {file.syncStatus && file.syncStatus !== 'synced' && (
            <span className={cn('text-xs px-2 py-0.5 rounded', file.syncStatus === 'syncing' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300')}>
              {file.syncStatus}
            </span>
          )}
          {file.metadata?.offline_available && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-600/20 text-green-300">offline</span>
          )}
          {file.isFavorite && (
            <Star className="h-3 w-3 fill-current text-yellow-500 flex-shrink-0" />
          )}
        </div>
      </td>
      <td className="p-3 text-muted-foreground">
        {formatDate(file.updatedAt || file.updated_at)}
      </td>
      <td className="p-3 text-muted-foreground">
        {formatBytes(file.size)}
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
        ) : (file.sharedCount && file.sharedCount > 0) ? (
          <span className="inline-flex items-center gap-1">
            <span className="h-4 w-4 rounded-full bg-[hsl(var(--primary))/0.2]" />
            <span>{`Shared (${file.sharedCount})`}</span>
          </span>
        ) : 'Private'}
      </td>
    </tr>
  )
}
