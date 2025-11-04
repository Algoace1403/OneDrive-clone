'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { FilePreviewModal } from '@/components/preview/file-preview-modal'
import { Button } from '@/components/ui/button'
import { Download, FileText, Loader2 } from 'lucide-react'
import { toast } from '@/lib/hooks/use-toast'
import { formatBytes, formatDate } from '@/lib/utils'

export default function SharedFilePage() {
  const params = useParams()
  const shareId = params.shareId as string
  
  const [file, setFile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    loadSharedFile()
  }, [shareId])

  const loadSharedFile = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/public/share/${shareId}`)
      setFile(response.data.file)
    } catch (error: any) {
      console.error('Error loading shared file:', error)
      setError(error.response?.data?.error || 'Failed to load shared file')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!file) return

    try {
      const response = await apiClient.get(`/public/share/${shareId}/download`)
      if (response.data.downloadUrl) {
        // Fetch the file from the signed URL and force download
        const fileResponse = await fetch(response.data.downloadUrl)
        const blob = await fileResponse.blob()
        
        // Create a download link
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = response.data.filename || file.name
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        toast({
          title: 'Success',
          description: 'File downloaded successfully'
        })
      }
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">File not found</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-card rounded-lg p-6 border border-border">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold mb-2">{file?.name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{formatBytes(file?.size || 0)}</span>
                <span>•</span>
                <span>Shared on {formatDate(file?.created_at)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowPreview(true)}
                variant="default"
                className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
              >
                <FileText className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
                className="border-border hover:bg-accent"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
          
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              This file has been shared with you. You can preview or download it using the buttons above.
            </p>
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      {showPreview && file && (
        <FilePreviewModal
          file={file}
          open={showPreview}
          onOpenChange={setShowPreview}
          onDownload={handleDownload}
          onShare={() => {}}
          onDelete={() => {}}
        />
      )}
    </div>
  )
}
