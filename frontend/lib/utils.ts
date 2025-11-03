import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function getFileIcon(fileName: string, isFolder: boolean = false) {
  if (isFolder) return 'folder'
  
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  const iconMap: { [key: string]: string } = {
    // Documents
    doc: 'file-text',
    docx: 'file-text',
    pdf: 'file-text',
    txt: 'file-text',
    // Spreadsheets
    xls: 'file-spreadsheet',
    xlsx: 'file-spreadsheet',
    csv: 'file-spreadsheet',
    // Presentations
    ppt: 'file-presentation',
    pptx: 'file-presentation',
    // Images
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    gif: 'image',
    svg: 'image',
    // Videos
    mp4: 'video',
    avi: 'video',
    mov: 'video',
    mkv: 'video',
    // Audio
    mp3: 'music',
    wav: 'music',
    flac: 'music',
    // Code
    js: 'file-code',
    ts: 'file-code',
    jsx: 'file-code',
    tsx: 'file-code',
    html: 'file-code',
    css: 'file-code',
    json: 'file-code',
    // Archives
    zip: 'archive',
    rar: 'archive',
    '7z': 'archive',
    tar: 'archive',
  }
  
  return iconMap[extension || ''] || 'file'
}

export function getFileTypeColor(fileName: string, isFolder: boolean = false) {
  if (isFolder) return 'text-blue-600'
  
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  const colorMap: { [key: string]: string } = {
    // Documents
    doc: 'file-icon-word',
    docx: 'file-icon-word',
    // Spreadsheets
    xls: 'file-icon-excel',
    xlsx: 'file-icon-excel',
    csv: 'file-icon-excel',
    // Presentations
    ppt: 'file-icon-powerpoint',
    pptx: 'file-icon-powerpoint',
    // PDF
    pdf: 'file-icon-pdf',
    // Images
    jpg: 'file-icon-image',
    jpeg: 'file-icon-image',
    png: 'file-icon-image',
    gif: 'file-icon-image',
    svg: 'file-icon-image',
    // Videos
    mp4: 'file-icon-video',
    avi: 'file-icon-video',
    mov: 'file-icon-video',
    mkv: 'file-icon-video',
    // Audio
    mp3: 'file-icon-audio',
    wav: 'file-icon-audio',
    flac: 'file-icon-audio',
    // Code
    js: 'file-icon-code',
    ts: 'file-icon-code',
    jsx: 'file-icon-code',
    tsx: 'file-icon-code',
    html: 'file-icon-code',
    css: 'file-icon-code',
    json: 'file-icon-code',
    // Archives
    zip: 'file-icon-archive',
    rar: 'file-icon-archive',
    '7z': 'file-icon-archive',
    tar: 'file-icon-archive',
  }
  
  return colorMap[extension || ''] || 'text-muted-foreground'
}
