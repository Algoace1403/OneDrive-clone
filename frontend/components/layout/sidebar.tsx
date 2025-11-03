'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import {
  Home,
  FileText,
  Users,
  Trash2,
  HelpCircle,
  Cloud,
  Diamond,
  FolderOpen,
  Plus,
  Upload,
  FolderPlus,
  Grid3x3,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/hooks/use-auth'
import { UploadDialog } from '@/components/files/upload-dialog'
import { CreateFolderDialog } from '@/components/files/create-folder-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Image as ImageIcon, FileText as DocIcon, Video } from 'lucide-react'

const navigation = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'My files', href: '/dashboard/files', icon: FileText },
  { name: 'Shared', href: '/dashboard/shared', icon: Users },
  { name: 'Recycle bin', href: '/dashboard/trash', icon: Trash2 },
  { name: 'Activity', href: '/dashboard/activity', icon: FolderOpen },
  { name: 'Offline', href: '/dashboard/offline', icon: Cloud },
]

const bottomLinks = [
  { name: 'Recent', href: '/dashboard/recent', icon: Home },
  { name: 'Photos', href: '/dashboard/recent?type=image', icon: ImageIcon },
  { name: 'Documents', href: '/dashboard/recent?type=document', icon: DocIcon },
  { name: 'Videos', href: '/dashboard/recent?type=video', icon: Video },
]

export function Sidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const currentFolderId = searchParams.get('folder')
  const { user } = useAuth()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [createFolderOpen, setCreateFolderOpen] = useState(false)

  const storagePercentage = user
    ? (user.storageUsed / user.storageLimit) * 100
    : 0

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="flex h-full w-64 flex-col bg-card text-foreground border-r border-border">
      {/* Title Section */}
      <div className="p-4 border-b border-border">
        {/* App launcher, logo, and Photos/Files toggle */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 p-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] hover:bg-transparent hover:text-inherit"
            title="Apps"
            aria-label="Apps"
          >
            <Image src="/image/9dot.png" alt="Apps" width={14} height={14} className="dark:invert" />
          </Button>
          <Image
            src={resolvedTheme === 'dark' ? '/image/onedrive-black.png' : '/image/onedrive-white.svg'}
            alt="OneDrive"
            width={36}
            height={8}
          />
          <div className="ml-auto flex items-center gap-1 bg-secondary rounded p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/recent?type=image')}
              className={cn(
                'h-7 px-3 rounded-full text-xs',
                pathname?.startsWith('/dashboard') && (searchParams.get('type') === 'image') ? 'bg-accent' : 'hover:bg-accent'
              )}
            >
              Photos
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/files')}
              className={cn(
                'h-7 px-3 rounded-full text-xs',
                pathname === '/dashboard/files' ? 'bg-accent' : 'hover:bg-accent'
              )}
            >
              Files
            </Button>
          </div>
        </div>
        
        {/* User Profile removed per request */}

        {/* Create or Upload Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-auto self-start h-8 px-3 bg-gradient-to-r from-[#0b3b8c] to-[#6d28d9] text-white hover:from-[#092e6f] hover:to-[#5a21c7] hover:bg-transparent hover:text-white text-xs flex items-center justify-center gap-1 rounded-full"
            >
              <Plus className="h-3.5 w-3.5" />
              Create or upload
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem onClick={() => setUploadOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload files
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCreateFolderOpen(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Create folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href === '/dashboard' && pathname === '/dashboard')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-full px-3 py-2 text-xs transition-colors mb-1',
                isActive
                  ? 'bg-accent'
                  : 'hover:bg-accent'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Browse files by section */}
      <div className="px-4 py-2">
        <p className="text-xs text-muted-foreground mb-2">Browse files by</p>
        {bottomLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-full px-3 py-2 text-xs transition-colors',
              pathname === item.href
                ? 'bg-accent'
                : 'hover:bg-accent'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
        ))}
      </div>

      {/* Storage Section */}
      <div className="mt-auto p-4 border-t border-border">
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">
            Get storage for all your files and photos
          </p>
          <Button 
            variant="outline" 
            className="w-full bg-transparent border-border text-[hsl(var(--primary))] hover:bg-accent text-xs"
          >
            <Diamond className="w-4 h-4 mr-2" />
            Buy storage
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium">Storage</p>
          <Progress 
            value={storagePercentage} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {user && (
              <>
                {formatBytes(user.storageUsed)} used of {formatBytes(user.storageLimit)} ({storagePercentage.toFixed(1)}%)
              </>
            )}
          </p>
        </div>
      </div>

      {/* Upload Dialog */}
      {uploadOpen && (
        <UploadDialog 
          open={uploadOpen} 
          onOpenChange={setUploadOpen}
          parentId={currentFolderId}
        />
      )}

      {/* Create Folder Dialog */}
      {createFolderOpen && (
        <CreateFolderDialog
          open={createFolderOpen}
          onOpenChange={setCreateFolderOpen}
          parentId={currentFolderId}
        />
      )}
    </div>
  )
}
