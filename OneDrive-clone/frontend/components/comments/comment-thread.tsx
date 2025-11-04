'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDate } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Edit2, 
  Trash2, 
  Reply, 
  ThumbsUp, 
  Heart, 
  Laugh, 
  Frown,
  MoreVertical,
  Send 
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { apiClient } from '@/lib/api/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { toast } from '@/lib/hooks/use-toast'

interface CommentThreadProps {
  comment: any
  fileId: string
  isReply?: boolean
}

const reactionIcons: { [key: string]: any } = {
  like: ThumbsUp,
  love: Heart,
  laugh: Laugh,
  sad: Frown,
}

export function CommentThread({ comment, fileId, isReply = false }: CommentThreadProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [replyContent, setReplyContent] = useState('')
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const updateCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiClient.patch(`/files/comments/${comment._id}`, { content })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', fileId] })
      setIsEditing(false)
      toast({ title: 'Comment updated' })
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/files/comments/${comment._id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', fileId] })
      toast({ title: 'Comment deleted' })
    },
  })

  const addReactionMutation = useMutation({
    mutationFn: async (type: string) => {
      await apiClient.post(`/files/comments/${comment._id}/reactions`, { type })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', fileId] })
    },
  })

  const createReplyMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiClient.post(`/files/${fileId}/comments`, {
        content,
        parentComment: comment._id,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', fileId] })
      setIsReplying(false)
      setReplyContent('')
      toast({ title: 'Reply posted' })
    },
  })

  const handleEdit = () => {
    updateCommentMutation.mutate(editContent)
  }

  const handleReply = () => {
    if (replyContent.trim()) {
      createReplyMutation.mutate(replyContent)
    }
  }

  const userReaction = comment.reactions?.find((r: any) => r.user._id === user?._id)

  return (
    <div className={`flex gap-3 ${isReply ? 'ml-12' : ''}`}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.user.profilePicture} />
        <AvatarFallback>
          {comment.user.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-medium text-sm">{comment.user.name}</span>
              <span className="text-xs text-muted-foreground ml-2">
                {formatDate(comment.createdAt)}
                {comment.isEdited && ' (edited)'}
              </span>
            </div>

            {user?._id === comment.user._id && !comment.isDeleted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(!isEditing)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => deleteCommentMutation.mutate()}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setEditContent(comment.content)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setIsReplying(!isReplying)}
          >
            <Reply className="h-3 w-3 mr-1" />
            Reply
          </Button>

          <div className="flex gap-1">
            {['like', 'love', 'laugh', 'sad'].map((reaction) => {
              const Icon = reactionIcons[reaction]
              const isActive = userReaction?.type === reaction
              const count = comment.reactions?.filter((r: any) => r.type === reaction).length || 0

              return (
                <Button
                  key={reaction}
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2 ${isActive ? 'bg-accent' : ''}`}
                  onClick={() => addReactionMutation.mutate(reaction)}
                >
                  <Icon className="h-3 w-3" />
                  {count > 0 && <span className="ml-1 text-xs">{count}</span>}
                </Button>
              )
            })}
          </div>
        </div>

        {isReplying && (
          <div className="mt-3 space-y-2">
            <Textarea
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleReply}>
                <Send className="h-3 w-3 mr-1" />
                Reply
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsReplying(false)
                  setReplyContent('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply: any) => (
              <CommentThread
                key={reply._id}
                comment={reply}
                fileId={fileId}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}