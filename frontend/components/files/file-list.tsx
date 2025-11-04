import { formatDate, formatBytes } from '@/lib/utils'
import { FileRow } from './file-row'
import { FolderRow } from './folder-row'

interface FileListProps {
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
}

export function FileList({
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
}: FileListProps) {
  const handleSelect = (fileId: string, isSelected: boolean) => {
    if (isSelected) {
      onFileSelect([...selectedFiles, fileId])
    } else {
      onFileSelect(selectedFiles.filter(id => id !== fileId))
    }
  }

  const selectAll = () => {
    const allIds = [...folders.map(f => f.id || f._id), ...files.map(f => f.id || f._id)]
    onFileSelect(allIds)
  }

  const deselectAll = () => {
    onFileSelect([])
  }

  const allSelected = [...folders, ...files].length > 0 && 
    selectedFiles.length === [...folders, ...files].length

  return (
    <div className="w-full">
      <table className="w-full table-fixed">
        <thead className="bg-card sticky top-0 z-10">
          <tr className="text-left text-sm text-muted-foreground border-b border-border">
            <th className="w-[40px] p-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={allSelected ? deselectAll : selectAll}
                className="rounded w-4 h-4"
              />
            </th>
            <th className="w-[16px] p-0"></th>
            <th className="p-3 font-normal flex items-center gap-1 hover:text-foreground cursor-pointer">
              Name
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </th>
            <th className="p-3 font-normal hover:text-foreground cursor-pointer">
              Modified
              <svg className="w-3 h-3 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </th>
            <th className="p-3 font-normal hover:text-foreground cursor-pointer">
              File size
              <svg className="w-3 h-3 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </th>
            <th className="p-3 font-normal hover:text-foreground cursor-pointer">
              Sharing
              <svg className="w-3 h-3 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {folders.map((folder) => (
            <FolderRow
              key={folder.id || folder._id}
              folder={folder}
              isSelected={selectedFiles.includes(folder.id || folder._id)}
              onSelect={(selected) => handleSelect(folder.id || folder._id, selected)}
              onClick={() => onFileClick(folder)}
              onDelete={() => onDelete(folder.id || folder._id)}
              onFavorite={() => onFavorite(folder.id || folder._id)}
              onShare={() => onShare(folder.id || folder._id)}
              onRename={onRename ? () => onRename(folder.id || folder._id) : undefined}
              
            />
          ))}
          {files.map((file) => (
            <FileRow
              key={file.id || file._id}
              file={file}
              isSelected={selectedFiles.includes(file.id || file._id)}
              onSelect={(selected) => handleSelect(file.id || file._id, selected)}
              onClick={() => onFileClick(file)}
              onDelete={() => onDelete(file.id || file._id)}
              onFavorite={() => onFavorite(file.id || file._id)}
              onShare={() => onShare(file.id || file._id)}
              onDownload={() => onDownload(file.id || file._id)}
              onRename={onRename ? () => onRename(file.id || file._id) : undefined}
              onVersionHistory={onVersionHistory ? () => onVersionHistory(file.id || file._id) : undefined}
              onManageAccess={onManageAccess ? () => onManageAccess(file.id || file._id) : undefined}
              onCopyLink={onCopyLink ? () => onCopyLink(file.id || file._id) : undefined}
              onDetails={onDetails ? () => onDetails(file.id || file._id) : undefined}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
