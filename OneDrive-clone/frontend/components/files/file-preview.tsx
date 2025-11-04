'use client'

import { useState, useEffect } from 'react'
import { X, Download, Share2, Info, Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { apiClient } from '@/lib/api/client'
import { formatBytes, formatDate } from '@/lib/utils'
import Image from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CommentSection } from '@/components/comments/comment-section'

interface FilePreviewProps {
  fileId: string
  fileName: string
  onClose: () => void
  onDownload: () => void
  onShare: () => void
}

export function FilePreview({
  fileId,
  fileName,
  onClose,
  onDownload,
  onShare,
}: FilePreviewProps) {
  const [loading, setLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileInfo, setFileInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPreview()
  }, [fileId])

  const loadPreview = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const extension = fileName.split('.').pop()?.toLowerCase() || ''
      
      // For previewable files, get the preview URL
      if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'pdf', 'txt', 'md', 'json', 'js', 'ts', 'html', 'css', 'xml'].includes(extension)) {
        setPreviewUrl(`${process.env.NEXT_PUBLIC_API_URL}/files/${fileId}/preview`)
        
        // For text files, fetch the content
        if (['txt', 'md', 'json', 'js', 'ts', 'html', 'css', 'xml'].includes(extension)) {
          const response = await apiClient.get(`/files/${fileId}/preview`, {
            responseType: 'text'
          })
          setFileInfo({ content: response.data, type: 'text' })
        } else if (extension === 'pdf') {
          setFileInfo({ type: 'pdf' })
        } else {
          setFileInfo({ type: 'image' })
        }
      } else {
        // For non-previewable files, get file info
        const response = await apiClient.get(`/files/${fileId}/preview`)
        setFileInfo(response.data.file)
      }
    } catch (err) {
      setError('Failed to load preview')
    } finally {
      setLoading(false)
    }
  }

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      )
    }

    if (!fileInfo) return null

    // Image preview
    if (fileInfo.type === 'image') {
      return (
        <div className="relative h-96 bg-background rounded-lg overflow-hidden">
          <img
            src={previewUrl!}
            alt={fileName}
            className="w-full h-full object-contain"
          />
        </div>
      )
    }

    // PDF preview
    if (fileInfo.type === 'pdf') {
      return (
        <iframe
          src={previewUrl!}
          className="w-full h-[600px] border rounded-lg"
          title={fileName}
        />
      )
    }

    // Text file preview
    if (fileInfo.type === 'text') {
      return (
        <div className="bg-muted p-4 rounded-lg overflow-auto max-h-[600px]">
          <pre className="text-sm whitespace-pre-wrap font-mono">
            {fileInfo.content}
          </pre>
        </div>
      )
    }

    // Non-previewable file
    return (
      <div className="flex h-96 items-center justify-center bg-muted rounded-lg">
        <div className="text-center">
          <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">{fileName}</p>
          <p className="text-sm text-muted-foreground mb-4">
            Preview not available for this file type
          </p>
          <p className="text-xs text-muted-foreground">
            Size: {formatBytes(fileInfo.size)}
          </p>
          <Button className="mt-4" onClick={onDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download to view
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span className="truncate">{fileName}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={onShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="preview" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="mt-4">
            {renderPreview()}
          </TabsContent>
          <TabsContent value="comments" className="mt-4 h-[600px]">
            <CommentSection fileId={fileId} fileName={fileName} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
