'use client'

import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { apiClient } from '@/lib/api/client'
import { formatBytes } from '@/lib/utils'
import { toast } from '@/lib/hooks/use-toast'

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentId: string | null
}

interface UploadFile {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export function UploadDialog({ open, onOpenChange, parentId }: UploadDialogProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const queryClient = useQueryClient()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }))
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  })

  const uploadFiles = async () => {
    setUploading(true)

    for (let i = 0; i < files.length; i++) {
      const uploadFile = files[i]
      if (uploadFile.status !== 'pending') continue

      try {
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'uploading' } : f
        ))

        const formData = new FormData()
        formData.append('file', uploadFile.file)
        if (parentId) formData.append('parentId', parentId)

        await apiClient.post('/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0
            
            setFiles(prev => prev.map((f, idx) => 
              idx === i ? { ...f, progress } : f
            ))
          },
        })

        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'success', progress: 100 } : f
        ))
      } catch (error: any) {
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { 
            ...f, 
            status: 'error', 
            error: error.response?.data?.error || 'Upload failed' 
          } : f
        ))
      }
    }

    setUploading(false)
    queryClient.invalidateQueries({ queryKey: ['files'] })
    
    const successCount = files.filter(f => f.status === 'success').length
    if (successCount > 0) {
      toast({
        title: 'Upload complete',
        description: `${successCount} file(s) uploaded successfully`,
      })
      
      // Close dialog after successful uploads
      setTimeout(() => {
        onOpenChange(false)
        setFiles([])
      }, 1000)
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'success'))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Drag and drop files here or click to browse
          </DialogDescription>
        </DialogHeader>

        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors hover:border-primary/50 hover:bg-accent/50
            ${isDragActive ? 'border-primary bg-accent' : 'border-border'}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            {isDragActive
              ? 'Drop the files here...'
              : 'Drag & drop files here, or click to select files'}
          </p>
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
            {files.map((uploadFile, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {uploadFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(uploadFile.file.size)}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {uploadFile.status === 'uploading' && (
                    <div className="w-32">
                      <Progress value={uploadFile.progress} className="h-2" />
                    </div>
                  )}
                  
                  {uploadFile.status === 'pending' && (
                    <span className="text-xs text-muted-foreground">Pending</span>
                  )}
                  
                  {uploadFile.status === 'success' && (
                    <span className="text-xs text-green-600">Uploaded</span>
                  )}
                  
                  {uploadFile.status === 'error' && (
                    <span className="text-xs text-destructive">{uploadFile.error}</span>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeFile(index)}
                    disabled={uploadFile.status === 'uploading'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {files.length > 0 && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={clearCompleted}
              disabled={uploading || !files.some(f => f.status === 'success')}
            >
              Clear completed
            </Button>
            <Button
              onClick={uploadFiles}
              disabled={uploading || !files.some(f => f.status === 'pending')}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload all'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}