'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { apiClient } from '@/lib/api/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { toast } from '@/lib/hooks/use-toast'
import { CommentThread } from './comment-thread'

interface CommentSectionProps {
  fileId: string
  fileName: string
}

export function CommentSection({ fileId, fileName }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', fileId],
    queryFn: async () => {
      const response = await apiClient.get(`/files/${fileId}/comments`)
      return response.data.comments
    },
  })

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiClient.post(`/files/${fileId}/comments`, {
        content,
      })
      return response.data.comment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', fileId] })
      setNewComment('')
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)
    await createCommentMutation.mutateAsync(newComment.trim())
    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4">
        <MessageSquare className="h-5 w-5" />
        <h3 className="font-semibold">Comments</h3>
        <span className="text-sm text-muted-foreground">
          ({comments?.length || 0})
        </span>
      </div>

      <ScrollArea className="flex-1 p-4">
        {comments && comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment: any) => (
              <CommentThread
                key={comment._id}
                comment={comment}
                fileId={fileId}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No comments yet</p>
            <p className="text-sm text-muted-foreground">
              Be the first to comment on this file
            </p>
          </div>
        )}
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="resize-none"
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Post
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
