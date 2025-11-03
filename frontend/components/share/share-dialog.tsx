'use client'

import { useState } from 'react'
import { Mail, Copy, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiClient } from '@/lib/api/client'
import { toast } from '@/lib/hooks/use-toast'

interface ShareDialogProps {
  file: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareDialog({ file, open, onOpenChange }: ShareDialogProps) {
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<'view' | 'edit' | 'comment'>('view')
  const [shareMessage, setShareMessage] = useState('')
  // Link sharing UI removed; generate view-only links on demand
  const [copied, setCopied] = useState(false)
  const [sharedUsers, setSharedUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleShareWithEmail = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      await apiClient.post(`/files/${file.id || file._id}/share`, {
        email,
        permission,
        message: shareMessage
      })

      toast({ title: 'Success', description: `File shared with ${email}` })
      setEmail('')
      setShareMessage('')
      loadSharedUsers()
    } catch (error: any) {
      // If backend reports user not found, fall back to invite flow
      const msg = error?.response?.data?.error || ''
      if (error?.response?.status === 404 && String(msg).toLowerCase().includes('user not found')) {
        try {
          const inviteRes = await apiClient.post('/share/invite', {
            fileId: file.id || file._id,
            email,
            permission,
          })
          const token = inviteRes.data?.invite?.token
          const shareUrl = `${window.location.origin}/shared/invite/${token}`
          await navigator.clipboard.writeText(shareUrl).catch(() => {})
          toast({ title: 'Invite created', description: `Link copied for ${email}` })
          setEmail('')
          setShareMessage('')
        } catch (e) {
          toast({ title: 'Error', description: 'Failed to create invite', variant: 'destructive' })
        }
      } else {
        toast({ title: 'Error', description: 'Failed to share file', variant: 'destructive' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateLink = async () => {
    try {
      setLoading(true)
      const response = await apiClient.post(`/files/${file.id || file._id}/share/link`, {
        permission: 'view'
      })
      
      const shareUrl = `${window.location.origin}/shared/${response.data.shareId}`
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      
      toast({
        title: 'Success',
        description: 'Share link copied to clipboard',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate share link',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSharedUsers = async () => {
    try {
      const response = await apiClient.get(`/files/${file.id || file._id}/shares`)
      setSharedUsers(response.data.shares || [])
    } catch (error) {
      console.error('Failed to load shared users:', error)
    }
  }

  const handleRemoveAccess = async (shareId: string) => {
    try {
      await apiClient.delete(`/files/shares/${shareId}`)
      toast({
        title: 'Success',
        description: 'Access removed',
      })
      loadSharedUsers()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove access',
        variant: 'destructive'
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share "{file?.name}"</DialogTitle>
        </DialogHeader>
        <div className="w-full space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Enter name or email</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Select value={permission} onValueChange={(value: any) => setPermission(value)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">Can view</SelectItem>
                    <SelectItem value="edit">Can edit</SelectItem>
                    <SelectItem value="comment">Can comment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Add a message (optional)</Label>
              <Input
                id="message"
                placeholder="Add a message"
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                className=""
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleShareWithEmail}
                disabled={!email || loading}
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send invitation
              </Button>
              <Button
                variant="outline"
                onClick={() => handleGenerateLink()}
                disabled={loading}
                className="flex-1"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Get link
                  </>
                )}
              </Button>
            </div>
            
            {sharedUsers.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-medium mb-2">People with access</h4>
                <div className="space-y-2">
                  {sharedUsers.map((share) => (
                    <div key={share.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground text-sm">
                          {share.shared_with_user?.name?.charAt(0) || share.email?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm">{share.shared_with_user?.name || share.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Can {share.permission}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAccess(share.id)}
                        className="text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
