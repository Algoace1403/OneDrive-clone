'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'
import { toast } from '@/lib/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface ConflictDialogProps {
  file: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConflictDialog({ file, open, onOpenChange }: ConflictDialogProps) {
  const [name, setName] = useState('')
  const [resolving, setResolving] = useState(false)
  const [currentPreview, setCurrentPreview] = useState<string | null>(null)
  const [prevPreview, setPrevPreview] = useState<string | null>(null)
  const [mime, setMime] = useState<string>('')
  const [currentText, setCurrentText] = useState<string>('')
  const [prevText, setPrevText] = useState<string>('')

  useEffect(() => {
    const loadPreviews = async () => {
      try {
        if (!file?.id && !file?._id) return
        const id = file.id || file._id
        const cur = await apiClient.get(`/files/${id}/preview`)
        setCurrentPreview(cur.data.previewUrl)
        setMime(cur.data.file?.mimeType || '')
        // fetch versions and get previous
        const vers = await apiClient.get(`/files/${id}/versions`)
        const versions = vers.data.versions || []
        if (versions.length >= 2) {
          const prev = versions.sort((a: any, b: any) => b.version_number - a.version_number)[1]
          const resp = await apiClient.get(`/files/${id}/versions/${prev.version_number}/preview`)
          setPrevPreview(resp.data.previewUrl)
        }
      } catch {}
    }
    if (open) {
      // Suggest unique copy name with timestamp
      const base = file?.name || ''
      const ts = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const stamp = `${ts.getFullYear()}-${pad(ts.getMonth()+1)}-${pad(ts.getDate())} ${pad(ts.getHours())}-${pad(ts.getMinutes())}`
      setName(`Copy of ${base} (${stamp})`)
      loadPreviews()
    }
  }, [open, file])

  useEffect(() => {
    const isText = (m: string) => m.startsWith('text/') || m.includes('json') || m.includes('xml')
    const fetchText = async (url: string | null, setter: (s: string) => void) => {
      try {
        if (!url) return
        const res = await fetch(url)
        const text = await res.text()
        setter(text)
      } catch {}
    }
    if (mime && (currentPreview || prevPreview) && (mime && (mime.startsWith('text/') || mime.includes('json') || mime.includes('xml')))) {
      fetchText(currentPreview, setCurrentText)
      fetchText(prevPreview, setPrevText)
    } else {
      setCurrentText('')
      setPrevText('')
    }
  }, [mime, currentPreview, prevPreview])

  const resolve = async (strategy: 'keep_local' | 'keep_remote' | 'keep_both') => {
    try {
      setResolving(true)
      await apiClient.post(`/sync/resolve/${file.id || file._id}`, {
        strategy,
        name: strategy === 'keep_both' ? name : undefined,
      })
      toast({ title: 'Conflict resolved' })
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: 'Error', description: 'Failed to resolve conflict', variant: 'destructive' })
    } finally {
      setResolving(false)
    }
  }

  // Basic line-by-line diff marker
  const renderTextBlock = (text: string, other: string) => {
    const a = (text || '').split('\n')
    const b = (other || '').split('\n')
    const len = Math.max(a.length, b.length)
    const rows = [] as JSX.Element[]
    for (let i = 0; i < len; i++) {
      const line = a[i] ?? ''
      const otherLine = b[i] ?? ''
      const words = line.split(/(\s+)/)
      const otherWords = otherLine.split(/(\s+)/)
      const maxw = Math.max(words.length, otherWords.length)
      const spans: JSX.Element[] = []
      const highlightChars = (w: string, ow: string) => {
        const out: JSX.Element[] = []
        const maxc = Math.max(w.length, ow.length)
        for (let c = 0; c < maxc; c++) {
          const ch = w[c] ?? ''
          const och = ow[c] ?? ''
          const changed = ch !== och
          out.push(<span key={c} className={changed ? 'bg-[#4c2f2f] text-red-300' : ''}>{ch || '\u00A0'}</span>)
        }
        return out
      }
      for (let j = 0; j < maxw; j++) {
        const w = words[j] ?? ''
        const ow = otherWords[j] ?? ''
        if (w !== ow && w.trim() !== '') {
          spans.push(<span key={j}>{highlightChars(w, ow)}</span>)
        } else {
          spans.push(<span key={j}>{w}</span>)
        }
      }
      rows.push(
        <div key={i} className="px-2">
          <code className="text-xs whitespace-pre-wrap">{spans}</code>
        </div>
      )
    }
    return <div className="h-40 overflow-auto border bg-[#111]">{rows}</div>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve conflict — {file?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs mb-1">My version</div>
              {currentText ? (
                renderTextBlock(currentText, prevText)
              ) : (currentPreview && mime.includes('pdf')) ? (
                <object data={currentPreview} type="application/pdf" width="100%" height="160">
                  <a href={currentPreview} target="_blank" className="text-blue-400 underline text-xs">Open PDF</a>
                </object>
              ) : currentPreview ? (
                <a href={currentPreview} target="_blank" className="text-blue-400 underline text-xs">Open preview</a>
              ) : (
                <div className="text-xs text-muted-foreground">No preview</div>
              )}
            </div>
            <div>
              <div className="text-xs mb-1">Other version</div>
              {prevText ? (
                renderTextBlock(prevText, currentText)
              ) : (prevPreview && mime.includes('pdf')) ? (
                <object data={prevPreview} type="application/pdf" width="100%" height="160">
                  <a href={prevPreview} target="_blank" className="text-blue-400 underline text-xs">Open PDF</a>
                </object>
              ) : prevPreview ? (
                <a href={prevPreview} target="_blank" className="text-blue-400 underline text-xs">Open preview</a>
              ) : (
                <div className="text-xs text-muted-foreground">No previous version available</div>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            A version conflict was detected. Choose a resolution strategy:
          </p>
          <div className="space-y-2">
            <Button className="w-full" disabled={resolving} onClick={() => resolve('keep_local')}>Keep my version</Button>
            <Button className="w-full" variant="outline" disabled={resolving} onClick={() => resolve('keep_remote')}>Keep other version</Button>
          </div>
          <div className="space-y-2 border-t pt-3">
            <label className="text-sm">Keep both (create a copy)</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <Button className="w-full" variant="secondary" disabled={resolving} onClick={() => resolve('keep_both')}>Keep both</Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
