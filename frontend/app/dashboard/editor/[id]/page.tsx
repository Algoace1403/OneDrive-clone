'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import { Button } from '@/components/ui/button'

export default function EditorPage() {
  const params = useParams()
  const id = params?.id as string
  const [file, setFile] = useState<any>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const prev = await apiClient.get(`/files/${id}/preview`).then(r => r.data)
        setPreviewUrl(prev.previewUrl)
        setFile(prev.file)
      } catch {}
    }
    if (id) load()
  }, [id])

  return (
    <div className="h-full bg-[#0c0c0c] p-6 text-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xl">Web Editor (mock) — {file?.name || 'Loading...'}</div>
          <div className="text-xs text-gray-400">This is a placeholder editor. Changes are not saved.</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.history.back()}>Back</Button>
          <Button disabled={!previewUrl || saving} onClick={() => setSaving(true)}>Save</Button>
        </div>
      </div>
      <div className="border border-[#2b2b2b] rounded bg-[#111] p-2 h-[75vh] overflow-auto">
        {previewUrl ? (
          file?.mimeType?.includes('pdf') ? (
            <object data={previewUrl} type="application/pdf" width="100%" height="100%">
              <a href={previewUrl} target="_blank" className="text-blue-400 underline">Open PDF</a>
            </object>
          ) : (
            <iframe src={previewUrl} className="w-full h-full" />
          )
        ) : (
          <div>Loading preview...</div>
        )}
      </div>
    </div>
  )
}
