'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'
import { FileGrid } from '@/components/files/file-grid'
import { FileList } from '@/components/files/file-list'
import { useViewMode } from '@/lib/contexts/view-mode-context'
import { WifiOff } from 'lucide-react'
import { FileGridSkeleton } from '@/components/files/file-grid-skeleton'
import { FileListSkeleton } from '@/components/files/file-list-skeleton'
import { toast } from '@/lib/hooks/use-toast'

export default function OfflinePage() {
  const { viewMode } = useViewMode()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string[]>([])

  const load = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/offline/manifest')
      const files = (res.data.items || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        size: i.size,
        mime_type: i.mimeType,
        isFolder: false,
        isFavorite: false,
        metadata: { offline_available: i.offline },
      }))
      setItems(files)
    } catch (e) {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="h-full bg-background p-6">
        {viewMode === 'grid' ? <FileGridSkeleton /> : <FileListSkeleton />}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <WifiOff className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No items marked for offline</p>
        </div>
      </div>
    )
  }

  const onFileClick = (file: any) => {}
  const onShare = (id: string) => {}
  const onDelete = (id: string) => {}
  const onFavorite = (id: string) => {}
  const onDownload = (id: string) => {}

  return (
    <div className="h-full bg-[#0c0c0c] p-6">
      <h2 className="text-xl font-light text-gray-300 mb-4">Available offline</h2>
      {viewMode === 'grid' ? (
        <FileGrid
          files={items}
          folders={[]}
          selectedFiles={selected}
          onFileSelect={setSelected}
          onFileClick={onFileClick}
          onDelete={onDelete}
          onFavorite={onFavorite}
          onShare={onShare}
          onDownload={onDownload}
        />
      ) : (
        <FileList
          files={items}
          folders={[]}
          selectedFiles={selected}
          onFileSelect={setSelected}
          onFileClick={onFileClick}
          onDelete={onDelete}
          onFavorite={onFavorite}
          onShare={onShare}
          onDownload={onDownload}
        />
      )}
    </div>
  )
}
