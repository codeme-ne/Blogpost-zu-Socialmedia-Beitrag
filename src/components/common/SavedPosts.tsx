import { useEffect, useState, memo } from 'react'
import { SavedPost, getSavedPosts, deleteSavedPost, updateSavedPost } from '@/api/appwrite'
import { SaveButton, EditButton, DeleteButton, LinkedInShareButton, XShareButton, InstagramShareButton } from '@/design-system/components/ActionButtons'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { PLATFORM_META, type Platform } from '@/config/platforms'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

interface SavedPostsProps {
  refreshKey?: number;
  isAuthenticated?: boolean;
  onLoginClick?: () => void;
  /** Brief highlight pulse after a save animation completes */
  highlighted?: boolean;
}

interface PostCardProps {
  post: SavedPost;
  editingPost: { id: string; content: string } | null;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onStartEdit: (id: string, content: string) => void;
  onCancelEdit: () => void;
  onEditContentChange: (content: string) => void;
}

/**
 * Compact post card optimized for narrow saved-posts column.
 * Shows platform color dot, truncated content, icon-only actions.
 */
const PostCard = memo(({ post, editingPost, onEdit, onDelete, onStartEdit, onCancelEdit, onEditContentChange }: PostCardProps) => {
  const isEditing = editingPost?.id === post.id
  const platform = (post.platform || 'linkedin') as Platform
  const meta = PLATFORM_META[platform]
  const [expanded, setExpanded] = useState(false)

  const truncatedContent = post.content.length > 120 && !expanded
    ? `${post.content.slice(0, 120)}...`
    : post.content

  return (
    <div
      className="p-3 rounded-lg border bg-white transition-all duration-200 hover:shadow-sm"
      style={{ borderLeftWidth: '3px', borderLeftColor: meta.color }}
    >
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editingPost.content}
            onChange={(e) => onEditContentChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-y"
            rows={Math.max(6, editingPost.content.split('\n').length + 2)}
            style={{ minHeight: '120px' }}
          />
          <div className="flex justify-end space-x-2">
            <Button
              onClick={onCancelEdit}
              variant="ghost"
              size="sm"
            >
              Abbrechen
            </Button>
            <SaveButton
              onClick={() => onEdit(post.id, editingPost.content)}
              size="sm"
            />
          </div>
        </div>
      ) : (
        <>
          {/* Platform indicator */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs">{meta.emoji}</span>
            <span className="text-xs text-muted-foreground font-medium">{meta.label}</span>
          </div>

          {/* Content - truncated */}
          <p className="text-gray-800 whitespace-pre-wrap text-sm leading-snug">
            {truncatedContent}
          </p>
          {post.content.length > 120 && (
            <button
              onClick={() => setExpanded(prev => !prev)}
              className="text-xs text-primary hover:underline mt-1"
            >
              {expanded ? 'Weniger' : 'Mehr anzeigen'}
            </button>
          )}

          {/* Actions - icon only */}
          <div className="mt-2 flex justify-end">
            <div className="flex gap-1">
              <EditButton
                onClick={() => onStartEdit(post.id, post.content)}
                size="sm"
                text=""
                title="Bearbeiten"
              />
              {platform === 'x' ? (
                <XShareButton tweetContent={post.content} size="sm" text="" title="Auf X teilen" />
              ) : platform === 'instagram' ? (
                <InstagramShareButton postContent={post.content} size="sm" text="" title="Auf Instagram teilen" />
              ) : (
                <LinkedInShareButton postContent={post.content} size="sm" text="" title="Auf LinkedIn teilen" />
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <div>
                    <DeleteButton size="sm" text="" title="Löschen" />
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Beitrag wirklich löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Diese Aktion kann nicht rückgängig gemacht werden.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Nein</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => onDelete(post.id)}
                    >
                      Ja
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </>
      )}
    </div>
  )
})
PostCard.displayName = 'PostCard'

const SavedPostsComponent = function SavedPosts({ refreshKey, isAuthenticated, onLoginClick, highlighted }: SavedPostsProps) {
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([])
  const [editingPost, setEditingPost] = useState<{ id: string, content: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      loadSavedPosts()
    } else {
      setSavedPosts([])
    }
  }, [refreshKey, isAuthenticated])

  const loadSavedPosts = async () => {
    setIsLoading(true)
    try {
      const posts = await getSavedPosts()
      setSavedPosts(posts)
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to load saved posts:', error)
      toast.error('Gespeicherte Beiträge konnten nicht geladen werden.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSavedPost(id)
      setSavedPosts(posts => posts.filter(p => p.id !== id))
    } catch {
      toast.error('Beitrag konnte nicht gelöscht werden.')
    }
  }

  const handleEdit = async (id: string, newContent: string) => {
    try {
      await updateSavedPost(id, newContent)
      setSavedPosts(posts => posts.map(p =>
        p.id === id ? { ...p, content: newContent } : p
      ))
      setEditingPost(null)
    } catch {
      toast.error('Beitrag konnte nicht aktualisiert werden.')
    }
  }

  return (
    <div className={`h-full flex flex-col ${highlighted ? 'animate-targetPulse' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-gray-50/80 backdrop-blur-sm border-b px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Gespeichert
        </span>
        {savedPosts.length > 0 && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {savedPosts.length}
          </Badge>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!isAuthenticated ? (
          <div className="p-3 rounded-lg border border-gray-200 bg-white text-center space-y-2">
            <p className="text-sm text-gray-700">Bitte logge dich ein, um gespeicherte Beiträge zu sehen.</p>
            {onLoginClick && (
              <Button onClick={onLoginClick} variant="default" size="sm">Login</Button>
            )}
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : savedPosts.length === 0 ? (
          <div className="p-3 rounded-lg border border-gray-200 bg-white text-center">
            <p className="text-sm text-gray-700">Noch keine gespeicherten Beiträge.</p>
          </div>
        ) : savedPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            editingPost={editingPost}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStartEdit={(id, content) => setEditingPost({ id, content })}
            onCancelEdit={() => setEditingPost(null)}
            onEditContentChange={(content) => setEditingPost(prev => prev ? { ...prev, content } : null)}
          />
        ))}
      </div>
    </div>
  )
}

export const SavedPosts = memo(SavedPostsComponent)
