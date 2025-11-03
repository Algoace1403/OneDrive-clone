'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

import { Search, Grid3x3, List, Settings, Bell, RefreshCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/use-auth'
import { useViewMode } from '@/lib/contexts/view-mode-context'
import { useSearch } from '@/lib/contexts/search-context'
import { useNotifications } from '@/lib/contexts/notifications'
import { SyncCenter } from '@/components/sync/sync-center'
import { useSyncStatusCounts } from '@/lib/hooks/use-sync-status'
import {
  DropdownMenu as Menu,
  DropdownMenuContent as MenuContent,
  DropdownMenuItem as MenuItem,
  DropdownMenuTrigger as MenuTrigger,
  DropdownMenuLabel as MenuLabel,
  DropdownMenuSeparator as MenuSeparator,
  DropdownMenuRadioGroup as MenuRadioGroup,
  DropdownMenuRadioItem as MenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'

interface HeaderProps {
  onSearch: (query: string) => void
}

export function Header({ onSearch }: HeaderProps) {
  const { user } = useAuth()
  const { viewMode, setViewMode } = useViewMode()
  const { query, setQuery } = useSearch()
  const { items, unreadCount, markAllRead } = useNotifications()
  const [syncOpen, setSyncOpen] = useState(false)
  const { syncing, failed } = useSyncStatusCounts()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()

  return (
    <>
      {/* Main header */}
      <header className="flex h-16 items-center justify-between bg-background px-4 md:px-6 text-foreground overflow-x-hidden border-b border-border">
        {/* Search */}
        <div className="relative w-full max-w-[480px] md:max-w-[520px] ml-0 md:ml-8">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-secondary border border-input pl-10 pr-4 h-9 text-foreground placeholder:text-muted-foreground focus:bg-muted focus:ring-1 focus:ring-[hsl(var(--ring))] rounded-full"
          />
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-secondary rounded p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn(
                "h-7 w-7 p-0 rounded",
                viewMode === 'list' ? 'bg-accent' : 'hover:bg-accent'
              )}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={cn(
                "h-7 w-7 p-0 rounded",
                viewMode === 'grid' ? 'bg-accent' : 'hover:bg-accent'
              )}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
          </div>

          {/* Filters removed from header */}

          {/* Get more storage button */}
          <Button
            variant="ghost"
            className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] hover:bg-accent px-3 py-2 h-9 gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd"/>
            </svg>
            Get more storage
          </Button>

          {/* Quick Sync removed to keep a single refresh */}

          {/* Sync Center and Theme moved into Settings */}

          {/* Notifications */}
          <Menu>
            <MenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] h-4 min-w-4 px-1">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </MenuTrigger>
            <MenuContent className="w-80 max-h-96 overflow-auto">
              <div className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button className="hover:underline" onClick={markAllRead}>Mark all read</button>
                )}
              </div>
              {items.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No notifications</div>
              ) : (
                items.map((n) => (
                  <MenuItem key={n.id} className="flex flex-col items-start gap-0.5">
                    <div className="text-sm text-foreground">{n.title}</div>
                    {n.description && <div className="text-xs text-muted-foreground">{n.description}</div>}
                  </MenuItem>
                ))
              )}
            </MenuContent>
          </Menu>

          {/* Settings */}
          <Menu>
            <MenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
                {(syncing + failed) > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-[10px] h-4 min-w-4 px-1">
                    {failed > 0 ? `${failed}!` : syncing}
                  </span>
                )}
              </Button>
            </MenuTrigger>
            <MenuContent className="w-64">
              <MenuLabel>Settings</MenuLabel>
              <MenuItem onClick={() => setSyncOpen(true)} className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2">
                  <RefreshCcw className="h-4 w-4" />
                  Sync Center
                </span>
                {(syncing + failed) > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-[10px] h-4 min-w-4 px-1">
                    {failed > 0 ? `${failed}!` : syncing}
                  </span>
                )}
              </MenuItem>
              <MenuSeparator />
              <MenuLabel>Appearance</MenuLabel>
              <MenuRadioGroup value={theme || 'system'} onValueChange={(v) => setTheme(v)}>
                <MenuRadioItem value="light">Light</MenuRadioItem>
                <MenuRadioItem value="dark">Dark</MenuRadioItem>
                <MenuRadioItem value="system">System</MenuRadioItem>
              </MenuRadioGroup>
            </MenuContent>
          </Menu>

          {/* User Profile avatar (initials) */}
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-medium text-sm cursor-pointer"
            title={user?.name || 'Account'}
          >
            {user?.name?.charAt(0).toUpperCase()}{user?.name?.charAt(1)?.toUpperCase() || ''}
          </div>
        </div>
      </header>

      {/* Promotional banner below header */}
      <div className="bg-background px-6 pb-2 border-b border-border">
        <div className="flex items-center gap-3 bg-[hsl(var(--primary))] px-4 py-2 rounded text-sm text-[hsl(var(--primary-foreground))]">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
          <span className="font-medium">Get 100 GB free for a month</span>
          <span className="text-xs opacity-80">Start your trial now to get more storage for all your files and photos.</span>
          <Button 
            size="sm"
            className="bg-[hsl(var(--primary-foreground))] text-[hsl(var(--primary))] hover:opacity-90 px-4 py-1 h-7 text-sm font-medium ml-auto"
          >
            Start free trial
          </Button>
          <button className="opacity-80 hover:opacity-100 ml-2 text-lg">×</button>
        </div>
      </div>
      <SyncCenter open={syncOpen} onOpenChange={setSyncOpen} />
    </>
  )
}
