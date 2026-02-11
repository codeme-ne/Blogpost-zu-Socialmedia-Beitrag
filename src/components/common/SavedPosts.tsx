import { useEffect, useState, memo } from 'react'
import { SavedPost, getSavedPosts, deleteSavedPost, updateSavedPost } from '@/api/appwrite'
import { SaveButton, EditButton, DeleteButton, LinkedInShareButton, XShareButton, InstagramShareButton } from '@/design-system/components/ActionButtons'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
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
  onCollapse: (collapsed: boolean) => void;
  refreshKey?: number;
  isAuthenticated?: boolean;
  onLoginClick?: () => void;
  initialExpanded?: boolean;
  /** Render as inline content (for 50/50 layout) instead of fixed sidebar */
  inline?: boolean;
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
 * Memoized post card component for both mobile and desktop layouts.
 * Uses responsive Tailwind classes to adapt padding, text size, and spacing.
 */
const PostCard = memo(({ post, editingPost, onEdit, onDelete, onStartEdit, onCancelEdit, onEditContentChange }: PostCardProps) => {
  const isEditing = editingPost?.id === post.id

  return (
    <div className="p-3 md:p-4 rounded-lg border border-gray-200 bg-white">
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editingPost.content}
            onChange={(e) => onEditContentChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm md:text-base resize-y"
            rows={Math.max(8, editingPost.content.split('\n').length + 2)}
            style={{ minHeight: '150px' }}
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
          <p className="text-gray-800 whitespace-pre-wrap text-sm md:text-base">{post.content}</p>
          <div className="mt-3 md:mt-4 flex justify-end">
            <div className="flex gap-1 md:gap-2">
              <EditButton
                onClick={() => onStartEdit(post.id, post.content)}
                size="sm"
                text=""
                title="Beitrag bearbeiten"
              />
              {post.platform === 'x' ? (
                <XShareButton
                  tweetContent={post.content}
                  size="sm"
                  text=""
                  title="Auf X teilen"
                />
              ) : post.platform === 'instagram' ? (
                <InstagramShareButton
                  postContent={post.content}
                  size="sm"
                  text=""
                  title="Auf Instagram teilen"
                />
              ) : (
                <LinkedInShareButton
                  postContent={post.content}
                  size="sm"
                  text=""
                  title="Auf LinkedIn teilen"
                />
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <div>
                    <DeleteButton
                      size="sm"
                      text=""
                      title="Beitrag löschen"
                    />
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Möchtest du diesen Beitrag wirklich löschen?
                    </AlertDialogTitle>
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

const SavedPostsComponent = function SavedPosts({ onCollapse, refreshKey, isAuthenticated, onLoginClick, initialExpanded, inline, highlighted }: SavedPostsProps) {
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([])
  const [isCollapsed, setIsCollapsed] = useState(!initialExpanded)
  const [editingPost, setEditingPost] = useState<{ id: string, content: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      loadSavedPosts()
    } else {
      setSavedPosts([])
    }
  }, [refreshKey, isAuthenticated])

  useEffect(() => {
    onCollapse(isCollapsed)
  }, [isCollapsed, onCollapse])

  useEffect(() => {
    if (initialExpanded !== undefined) {
      setIsCollapsed(!initialExpanded)
    }
  }, [initialExpanded])

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

  // Inline rendering mode for 50/50 layout (desktop/tablet)
  if (inline) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center h-14 px-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-gray-800">
            Gespeicherte Beiträge
          </h2>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!isAuthenticated ? (
            <div className="p-4 rounded-lg border border-gray-200 bg-white text-center space-y-2">
              <p className="text-gray-700">Bitte logge dich ein, um gespeicherte Beiträge zu sehen.</p>
              {onLoginClick && (
                <Button onClick={onLoginClick} variant="default" size="sm">Login</Button>
              )}
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : savedPosts.length === 0 ? (
            <div className="p-4 rounded-lg border border-gray-200 bg-white text-center">
              <p className="text-gray-700">Noch keine gespeicherten Beiträge.</p>
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

  return (
    <>
  {/* Mobile: Bottom drawer */}
  <div data-save-target className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg transition-transform duration-300 z-40 ${isCollapsed ? 'translate-y-[calc(100%-3rem)]' : 'translate-y-0'}`} style={{ maxHeight: '60vh', paddingBottom: 'env(safe-area-inset-bottom)' }}>
  <div className="flex items-center justify-between p-3 border-b">
          <h2 className="text-lg font-bold text-gray-800">Gespeicherte Beiträge</h2>
          <div className="flex items-center gap-1">
            <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          </div>
        </div>
  <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(50vh - 4rem)' }}>
          {!isAuthenticated ? (
            <div className="p-4 rounded-lg border border-gray-200 bg-white text-center space-y-2">
              <p className="text-gray-700 text-sm">Bitte logge dich ein, um gespeicherte Beiträge zu sehen.</p>
              {onLoginClick && (
                <Button onClick={onLoginClick} variant="default" size="sm">Login</Button>
              )}
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : savedPosts.length === 0 ? (
            <div className="p-4 rounded-lg border border-gray-200 bg-white text-center">
              <p className="text-gray-700 text-sm">Noch keine gespeicherten Beiträge.</p>
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

      {/* Desktop: Side panel (full right edge, below header) */}
      <div
        data-save-target
        className={`hidden lg:block fixed right-0 top-16 h-[calc(100vh-4rem)] bg-white shadow-lg transition-transform duration-300 z-20 ${isCollapsed ? 'translate-x-[calc(100%-3rem)]' : 'translate-x-0'} ${highlighted ? 'animate-targetPulse' : ''}`}
        style={{ width: '22rem' }}
      >
        <div className="h-full flex flex-col">
          {/* Header with collapse button */}
          <div className="flex items-center h-16 border-b border-gray-200 bg-gray-50/50 sticky top-0 z-10">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-3 hover:bg-gray-100 transition-colors duration-200"
              aria-label={isCollapsed ? "Seitenleiste öffnen" : "Seitenleiste schließen"}
            >
              <svg
                className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h2 className={`text-lg font-semibold text-gray-800 py-3 transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
              Gespeicherte Beiträge
            </h2>
          </div>
          
          {/* Content area */}
          <div className="flex-1 overflow-hidden">
            <div className={`p-4 space-y-4 overflow-y-auto h-full transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {!isAuthenticated ? (
            <div className="p-4 rounded-lg border border-gray-200 bg-white text-center space-y-2">
              <p className="text-gray-700">Bitte logge dich ein, um gespeicherte Beiträge zu sehen.</p>
              {onLoginClick && (
                <Button onClick={onLoginClick} variant="default" size="sm">Login</Button>
              )}
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : savedPosts.length === 0 ? (
            <div className="p-4 rounded-lg border border-gray-200 bg-white text-center">
              <p className="text-gray-700">Noch keine gespeicherten Beiträge.</p>
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
        </div>
      </div>
    </>
  )
}

export const SavedPosts = memo(SavedPostsComponent) 