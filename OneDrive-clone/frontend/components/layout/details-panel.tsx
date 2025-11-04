'use client'

import { useState } from 'react'
import { X, FileText, Users, Clock, HardDrive, Link, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatBytes, formatDate, getFileIcon, getFileTypeColor } from '@/lib/utils'
import * as Icons from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface DetailsPanelProps {
  file: any
  isOpen: boolean
  onClose: () => void
}

export function DetailsPanel({ file, isOpen, onClose }: DetailsPanelProps) {
  const [activeTab, setActiveTab] = useState('details')

  if (!file || !isOpen) return null

  const iconName = getFileIcon(file.name, file.isFolder)
  const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<any> || FileText
  const colorClass = getFileTypeColor(file.name, file.isFolder)

  return (
    <div className={`fixed right-0 top-0 h-full w-80 bg-background shadow-lg z-50 details-panel ${isOpen ? 'open' : 'closed'}`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <IconComponent className={`h-10 w-10 ${colorClass}`} />
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">{file.name}</h2>
              <p className="text-sm text-muted-foreground">
                {file.isFolder ? 'Folder' : file.extension?.toUpperCase() || 'File'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="w-full rounded-none">
          <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
          <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[calc(100vh-180px)]">
          <TabsContent value="details" className="p-4 space-y-4">
            {/* File info */}
            <div>
              <h3 className="text-sm font-medium mb-2">Information</h3>
              <div className="space-y-2 text-sm">
                {!file.isFolder && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size</span>
                    <span>{formatBytes(file.size)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modified</span>
                  <span>{formatDate(file.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(file.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Separator removed */}

            {/* Storage info */}
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Storage
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span>My Files</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Owner</span>
                  <span>{file.owner?.name || 'You'}</span>
                </div>
              </div>
            </div>

            {/* Separator removed */}

            {/* Sharing info */}
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Sharing
              </h3>
              {file.sharedWith && file.sharedWith.length > 0 ? (
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    Shared with {file.sharedWith.length} {file.sharedWith.length === 1 ? 'person' : 'people'}
                  </p>
                  {file.sharedWith.slice(0, 3).map((share: any, idx: number) => {
                    const user = share.shared_with_user || share.user || null
                    const displayName: string = (user?.name || user?.email || share.email || 'Unknown') as string
                    const initials = displayName
                      .split(/\s+/)
                      .map((p: string) => p.charAt(0).toUpperCase())
                      .slice(0, 2)
                      .join('')
                    const key = share.id || user?.id || share.shared_with_user_id || `share-${idx}`
                    const avatarUrl = user?.profile_picture || undefined
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {avatarUrl ? (
                              <AvatarImage src={avatarUrl} alt={displayName} />
                            ) : null}
                            <AvatarFallback className="text-[10px]">{initials || '?'}</AvatarFallback>
                          </Avatar>
                          <span>{displayName}</span>
                        </div>
                        <span className="text-muted-foreground">{share.permission}</span>
                      </div>
                    )
                  })}
                  {file.sharedWith.length > 3 && (
                    <Button variant="link" size="sm" className="p-0">
                      View all
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not shared</p>
              )}
            </div>

            {file.publicLink && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    Public link
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Anyone with the link can {file.publicLink.permission}
                  </p>
                </div>
              </>
            )}

            {/* Separator removed */}

            {/* Version info */}
            {!file.isFolder && file.versions && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Version history
                </h3>
                <p className="text-sm text-muted-foreground">
                  {file.versions.length} {file.versions.length === 1 ? 'version' : 'versions'} available
                </p>
                <Button variant="link" size="sm" className="p-0 mt-1">
                  View history
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="p-4">
            <div className="space-y-3">
              <div className="text-sm">
                <p className="font-medium">You uploaded this file</p>
                <p className="text-muted-foreground">{formatDate(file.createdAt)}</p>
              </div>
              {file.updatedAt !== file.createdAt && (
                <div className="text-sm">
                  <p className="font-medium">You modified this file</p>
                  <p className="text-muted-foreground">{formatDate(file.updatedAt)}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}
