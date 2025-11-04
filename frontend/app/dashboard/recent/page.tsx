'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { FileList } from '@/components/files/file-list'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Image, FileText, Video, Music } from 'lucide-react'
import { FileGridSkeleton } from '@/components/files/file-grid-skeleton'
import { FileListSkeleton } from '@/components/files/file-list-skeleton'

export default function RecentPage() {
  // Force tabular (list) view for Recent
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])

  const searchParams = useSearchParams()
  const router = useRouter()
  const [type, setType] = useState<'all' | 'image' | 'document' | 'video' | 'audio'>('all')

  useEffect(() => {
    const t = (searchParams.get('type') as any) || 'all'
    if (['all','image','document','video','audio'].includes(t)) {
      setType(t)
    }
  }, [searchParams])
  const { data, isLoading } = useQuery({
    queryKey: ['files', 'recent', type],
    queryFn: async () => {
      const response = await apiClient.get(`/files/recent${type !== 'all' ? `?type=${type}` : ''}`)
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="h-full bg-background p-6">
        <FileListSkeleton />
      </div>
    )
  }

  const handleFileClick = (file: any) => {
    // Open file preview
  }

  const handleDelete = (fileId: string) => {
    // Delete file
  }

  const handleFavorite = (fileId: string) => {
    // Toggle favorite
  }

  const handleShare = (fileId: string) => {
    // Share file
  }

  const handleDownload = (fileId: string) => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/files/${fileId}/download`, '_blank')
  }

  return (
    <div className="space-y-4 ml-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recent Files</h1>
        <div className="flex gap-2 items-center text-sm">
          <button className={`px-3 py-1 rounded ${type==='all'?'bg-accent':'text-muted-foreground'}`} onClick={() => router.push('/dashboard/recent?type=all')}>All</button>
          <button className={`px-3 py-1 rounded flex items-center gap-1 ${type==='image'?'bg-accent':'text-muted-foreground'}`} onClick={() => router.push('/dashboard/recent?type=image')}><Image className="h-3 w-3"/>Photos</button>
          <button className={`px-3 py-1 rounded flex items-center gap-1 ${type==='document'?'bg-accent':'text-muted-foreground'}`} onClick={() => router.push('/dashboard/recent?type=document')}><FileText className="h-3 w-3"/>Documents</button>
          <button className={`px-3 py-1 rounded flex items-center gap-1 ${type==='video'?'bg-accent':'text-muted-foreground'}`} onClick={() => router.push('/dashboard/recent?type=video')}><Video className="h-3 w-3"/>Videos</button>
          <button className={`px-3 py-1 rounded flex items-center gap-1 ${type==='audio'?'bg-accent':'text-muted-foreground'}`} onClick={() => router.push('/dashboard/recent?type=audio')}><Music className="h-3 w-3"/>Audio</button>
      </div>
    </div>
      
      {data?.files?.length === 0 ? (
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">No recent files</p>
            <p className="text-sm text-muted-foreground">
              Files you've recently accessed will appear here
            </p>
          </div>
        </div>
      ) : (
        <FileList
          files={data?.files || []}
          folders={[]}
          selectedFiles={selectedFiles}
          onFileSelect={setSelectedFiles}
          onFileClick={handleFileClick}
          onDelete={handleDelete}
          onFavorite={handleFavorite}
          onShare={handleShare}
          onDownload={handleDownload}
        />
      )}
    </div>
  )
}
