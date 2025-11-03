'use client'

import { useState, useEffect } from 'react'
import { X, Download, Share2, MoreVertical, ExternalLink, FileText, Image as ImageIcon, FileVideo, Music, Code } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { apiClient } from '@/lib/api/client'
import { toast } from '@/lib/hooks/use-toast'
import { cn, formatBytes, getFileIcon } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface FilePreviewModalProps {
  file: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onDownload: () => void
  onShare: () => void
  onDelete: () => void
}

export function FilePreviewModal({
  file,
  open,
  onOpenChange,
  onDownload,
  onShare,
  onDelete
}: FilePreviewModalProps) {
  const [loading, setLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && file) {
      loadPreview()
    }
  }, [open, file])

  const loadPreview = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.get(`/files/${file.id || file._id}/preview`)
      setPreviewUrl(response.data.previewUrl)
    } catch (err) {
      console.error('Preview error:', err)
      setError('Failed to load preview')
    } finally {
      setLoading(false)
    }
  }

  const getFileType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType === 'application/pdf') return 'pdf'
    if (mimeType.startsWith('text/') || 
        mimeType === 'application/json' ||
        mimeType === 'application/javascript' ||
        mimeType === 'application/xml') return 'text'
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword') return 'word'
    if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mimeType === 'application/vnd.ms-excel') return 'excel'
    if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        mimeType === 'application/vnd.ms-powerpoint') return 'powerpoint'
    return 'unknown'
  }

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[600px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }

    if (error || !previewUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-[600px] text-muted-foreground">
          <FileText className="h-16 w-16 mb-4" />
          <p className="text-lg mb-2">Preview not available</p>
          <p className="text-sm text-muted-foreground">{error || 'This file type cannot be previewed'}</p>
          <Button
            onClick={onDownload}
            className="mt-4"
            variant="default"
          >
            <Download className="h-4 w-4 mr-2" />
            Download file
          </Button>
        </div>
      )
    }

    const fileType = getFileType(file.mimeType || file.mime_type || '')

    switch (fileType) {
      case 'image':
        return (
          <div className="flex items-center justify-center h-[600px] bg-background">
            <img 
              src={previewUrl} 
              alt={file.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )

      case 'pdf':
        return (
          <iframe
            src={previewUrl}
            className="w-full h-[600px] border-0"
            title={file.name}
          />
        )

      case 'text':
        return (
          <iframe
            src={previewUrl}
            className="w-full h-[600px] border-0 bg-secondary"
            title={file.name}
          />
        )

      case 'video':
        return (
          <div className="flex items-center justify-center h-[600px] bg-background">
            <video 
              src={previewUrl} 
              controls
              className="max-w-full max-h-full"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center h-[600px]">
            <Music className="h-24 w-24 text-muted-foreground mb-8" />
            <audio 
              src={previewUrl} 
              controls
              className="w-full max-w-md"
            >
              Your browser does not support the audio tag.
            </audio>
          </div>
        )

      case 'word':
      case 'excel':
      case 'powerpoint':
        return (
          <div className="flex flex-col items-center justify-center h-[600px] text-muted-foreground">
            <div className={cn(
              "h-24 w-24 mb-6 flex items-center justify-center rounded-lg bg-secondary"
            )}>
              <FileText className="h-12 w-12 text-white" />
            </div>
            <p className="text-lg mb-4">{file.name}</p>
            <p className="text-sm text-muted-foreground mb-6">
              {fileType === 'word' && 'Microsoft Word Document'}
              {fileType === 'excel' && 'Microsoft Excel Spreadsheet'}
              {fileType === 'powerpoint' && 'Microsoft PowerPoint Presentation'}
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  toast({
                    title: 'Opening in Office Online...',
                    description: 'This feature will open the file in Microsoft Office Online (coming soon)'
                  })
                }}
                variant="default"
                className=""
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in {fileType === 'word' ? 'Word' : fileType === 'excel' ? 'Excel' : 'PowerPoint'}
              </Button>
              <Button
                onClick={onDownload}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        )

      default:
        return (
          <div className="flex flex-col items-center justify-center h-[600px] text-muted-foreground">
            <FileText className="h-16 w-16 mb-4" />
            <p className="text-lg mb-2">Preview not available</p>
            <p className="text-sm text-muted-foreground mb-6">This file type cannot be previewed</p>
            <Button
              onClick={onDownload}
              variant="default"
            >
              <Download className="h-4 w-4 mr-2" />
              Download file
            </Button>
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3 flex-1">
            <div>
              <h2 className="text-lg font-normal">{file?.name}</h2>
              <p className="text-sm text-muted-foreground">
                {file && formatBytes(file.size)} • {file?.mimeType || file?.mime_type}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onShare}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDownload}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Download className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#2b2b2b] border-[#3b3b3b]">
                <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-[#3b3b3b]">
                  <FileText className="mr-2 h-4 w-4" />
                  Details
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-[#3b3b3b]">
                  Version history
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#3b3b3b]" />
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-red-400 hover:text-red-300 hover:bg-[#3b3b3b]"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 text-gray-400 hover:text-white ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
