'use client'

import { useEffect, useState } from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api/client'
import { cn } from '@/lib/utils'

interface BreadcrumbProps {
  folderId: string | null
  onNavigate: (folderId: string | null) => void
}

interface PathItem {
  id: string
  name: string
  isRoot: boolean
}

export function Breadcrumb({ folderId, onNavigate }: BreadcrumbProps) {
  const [path, setPath] = useState<PathItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (folderId) {
      fetchPath()
    } else {
      setPath([{ id: 'root', name: 'My Files', isRoot: true }])
    }
  }, [folderId])

  const fetchPath = async () => {
    if (!folderId) return
    
    setLoading(true)
    try {
      const response = await apiClient.get(`/folders/${folderId}/path`)
      setPath(response.data.path)
    } catch (error) {
      console.error('Failed to fetch path:', error)
    }
    setLoading(false)
  }

  return (
    <nav className="flex items-center space-x-1 text-sm">
      {path.map((item, index) => (
        <div key={item.id} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-auto px-2 py-1",
              index === path.length - 1 && "font-semibold"
            )}
            onClick={() => onNavigate(item.isRoot ? null : item.id)}
          >
            {item.isRoot && <Home className="h-4 w-4 mr-1" />}
            {item.name}
          </Button>
        </div>
      ))}
    </nav>
  )
}