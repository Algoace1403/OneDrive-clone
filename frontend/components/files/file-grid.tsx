import { FileCard } from './file-card'
import { FolderCard } from './folder-card'

import { DragEvent } from 'react'

interface FileGridProps {
  files: any[]
  folders: any[]
  selectedFiles: string[]
  onFileSelect: (files: string[]) => void
  onFileClick: (file: any) => void
  onDelete: (fileId: string) => void
  onFavorite: (fileId: string) => void
  onShare: (fileId: string) => void
  onDownload: (fileId: string) => void
  onRename?: (fileId: string) => void
  onVersionHistory?: (fileId: string) => void
  onManageAccess?: (fileId: string) => void
  onCopyLink?: (fileId: string) => void
  onDetails?: (fileId: string) => void
  onDragStart?: (e: DragEvent, file: any) => void
  onDrop?: (e: DragEvent, file: any) => void
}

export function FileGrid({
  files,
  folders,
  selectedFiles,
  onFileSelect,
  onFileClick,
  onDelete,
  onFavorite,
  onShare,
  onDownload,
  onRename,
  onVersionHistory,
  onManageAccess,
  onCopyLink,
  onDetails,
  onDragStart,
  onDrop,
}: FileGridProps) {
  const handleSelect = (fileId: string, isSelected: boolean) => {
    if (isSelected) {
      onFileSelect([...selectedFiles, fileId])
    } else {
      onFileSelect(selectedFiles.filter(id => id !== fileId))
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {folders.map((folder) => (
        <FolderCard
          key={folder.id || folder._id}
          folder={folder}
          isSelected={selectedFiles.includes(folder.id || folder._id)}
          onSelect={(selected) => handleSelect(folder.id || folder._id, selected)}
          onClick={() => onFileClick(folder)}
          onDelete={() => onDelete(folder.id || folder._id)}
          onFavorite={() => onFavorite(folder.id || folder._id)}
          onShare={() => onShare(folder.id || folder._id)}
          onManageAccess={onManageAccess ? () => onManageAccess(folder.id || folder._id) : undefined}
          onCopyLink={onCopyLink ? () => onCopyLink(folder.id || folder._id) : undefined}
        />
      ))}
      {files.map((file) => (
        <FileCard
          key={file.id || file._id}
          file={file}
          isSelected={selectedFiles.includes(file.id || file._id)}
          onSelect={(selected) => handleSelect(file.id || file._id, selected)}
          onClick={() => onFileClick(file)}
          onDelete={() => onDelete(file.id || file._id)}
          onFavorite={() => onFavorite(file.id || file._id)}
          onShare={() => onShare(file.id || file._id)}
          onManageAccess={onManageAccess ? () => onManageAccess(file.id || file._id) : undefined}
          onCopyLink={onCopyLink ? () => onCopyLink(file.id || file._id) : undefined}
          onDetails={onDetails ? () => onDetails(file.id || file._id) : undefined}
          onDownload={() => onDownload(file.id || file._id)}
          onRename={onRename ? () => onRename(file.id || file._id) : undefined}
          onVersionHistory={onVersionHistory ? () => onVersionHistory(file.id || file._id) : undefined}
          onDragStart={onDragStart ? (e) => onDragStart(e, file) : undefined}
          onDrop={onDrop ? (e) => onDrop(e, file) : undefined}
        />
      ))}
    </div>
  )
}
