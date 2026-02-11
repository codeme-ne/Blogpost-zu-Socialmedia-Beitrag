import { memo, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { PLATFORM_META, type Platform } from '@/config/platforms'
import { CharacterCounterTextarea } from '@/components/common/CharacterCounter'
import { CopyButton } from '@/components/ui/copy-button'
import {
  SaveButton,
  EditButton,
  LinkedInShareButton,
  XShareButton,
  InstagramShareButton,
} from '@/design-system/components/ActionButtons'
import { toast } from 'sonner'

interface PlatformPreviewCardProps {
  platform: Platform
  content: string
  index: number
  /** Edit mode state */
  isEditing?: boolean
  editContent?: string
  onEditContentChange?: (value: string) => void
  /** Actions */
  onStartEdit?: () => void
  onCancelEdit?: () => void
  onSaveEdit?: () => void
  onSave?: (e: React.MouseEvent<HTMLButtonElement>) => void
  onShare?: () => void
  /** Compact mode for saved-posts column */
  compact?: boolean
}

/**
 * Highlights hashtags in Instagram content with gradient-colored text.
 */
function HighlightedContent({ content, platform }: { content: string; platform: Platform }) {
  if (platform !== 'instagram') {
    return <>{content}</>
  }

  // Split content into regular text and hashtag sections
  const hashtagRegex = /(#\w+)/g
  const parts = content.split(hashtagRegex)

  return (
    <>
      {parts.map((part, i) =>
        hashtagRegex.test(part) ? (
          <span key={i} className="text-purple-600 font-medium">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

/** LinkedIn Preview: Professional style with blue left border */
function LinkedInPreview({ content, isEditing, editContent, onEditContentChange, actions }: {
  content: string
  isEditing: boolean
  editContent: string
  onEditContentChange: (v: string) => void
  actions: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-lg bg-white border border-gray-200 transition-all duration-200",
        "hover:shadow-[0_0_15px_rgba(10,102,194,0.25)]"
      )}
      style={{ borderLeftWidth: '3px', borderLeftColor: '#0A66C2' }}
      data-post-card
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-5 pb-0">
        <div className="w-10 h-10 rounded-full bg-[#0A66C2]/10 flex items-center justify-center text-sm font-semibold text-[#0A66C2]">
          Du
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Du</p>
          <p className="text-xs text-gray-500">Gerade eben</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {isEditing ? (
          <CharacterCounterTextarea
            value={editContent}
            onChange={onEditContentChange}
            platform="linkedin"
            rows={8}
          />
        ) : (
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-[15px]">
            {content}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-5 py-3">
        {actions}
      </div>
    </div>
  )
}

/** X Preview: Compact tweet-like style */
function XPreview({ content, isEditing, editContent, onEditContentChange, actions }: {
  content: string
  isEditing: boolean
  editContent: string
  onEditContentChange: (v: string) => void
  actions: React.ReactNode
}) {
  const charCount = content.length

  return (
    <div
      className={cn(
        "rounded-lg bg-white border transition-all duration-200",
        "hover:shadow-[0_0_15px_rgba(0,0,0,0.15)]"
      )}
      style={{ borderColor: '#E1E8ED' }}
      data-post-card
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-4 pb-0">
        <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-xs font-bold text-white">
          X
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-gray-900">Du</span>
          <span className="text-sm text-gray-500">@dein_handle</span>
          <span className="text-gray-400 text-xs">· Gerade eben</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-2">
        {isEditing ? (
          <CharacterCounterTextarea
            value={editContent}
            onChange={onEditContentChange}
            platform="x"
            rows={4}
          />
        ) : (
          <>
            <p className="text-gray-900 whitespace-pre-wrap leading-snug text-[15px]">
              {content}
            </p>
            {charCount > 250 && (
              <p className="text-xs text-gray-400 mt-2 font-mono">
                {charCount}/280
              </p>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-2.5" style={{ borderColor: '#E1E8ED' }}>
        {actions}
      </div>
    </div>
  )
}

/** Instagram Preview: Visual style with gradient accent */
function InstagramPreview({ content, isEditing, editContent, onEditContentChange, actions }: {
  content: string
  isEditing: boolean
  editContent: string
  onEditContentChange: (v: string) => void
  actions: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-lg bg-[#FAFAFA] border border-[#DBDBDB] overflow-hidden transition-all duration-200",
        "hover:shadow-[0_0_15px_rgba(131,58,180,0.25)]"
      )}
      data-post-card
    >
      {/* Gradient top border */}
      <div className="h-0.5" style={{ background: 'linear-gradient(45deg, #833AB4, #FD1D1D, #F77737)' }} />

      {/* Header */}
      <div className="flex items-center gap-2.5 p-4 pb-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ background: 'linear-gradient(45deg, #833AB4, #FD1D1D, #F77737)' }}
        >
          IG
        </div>
        <span className="text-sm font-semibold text-gray-900">dein_username</span>
      </div>

      {/* Content */}
      <div className="p-4">
        {isEditing ? (
          <CharacterCounterTextarea
            value={editContent}
            onChange={onEditContentChange}
            platform="instagram"
            rows={6}
          />
        ) : (
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">
            <HighlightedContent content={content} platform="instagram" />
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#DBDBDB] px-4 py-2.5">
        {actions}
      </div>
    </div>
  )
}

export const PlatformPreviewCard = memo(function PlatformPreviewCard({
  platform,
  content,
  index,
  isEditing = false,
  editContent = '',
  onEditContentChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onSave,
  onShare,
}: PlatformPreviewCardProps) {
  const meta = PLATFORM_META[platform]

  const editActions = useMemo(() => (
    <div className="flex justify-end gap-2">
      <button
        onClick={onCancelEdit}
        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
        Abbrechen
      </button>
      <SaveButton size="sm" onClick={() => onSaveEdit?.()} />
    </div>
  ), [onCancelEdit, onSaveEdit])

  const viewActions = useMemo(() => (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">
        {meta.emoji} {meta.label} · Post #{index + 1}
      </span>
      <div className="flex gap-1">
        <CopyButton
          text={content}
          size="sm"
          variant="ghost"
          onCopy={() => toast.success('Kopiert!')}
        />
        <EditButton
          size="sm"
          onClick={() => onStartEdit?.()}
          text=""
          title="Bearbeiten"
        />
        <SaveButton
          size="sm"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => onSave?.(e)}
          text=""
          title="Speichern"
        />
        {platform === 'linkedin' && (
          <LinkedInShareButton
            size="sm"
            text=""
            onClick={() => onShare?.()}
            title="Auf LinkedIn teilen"
          />
        )}
        {platform === 'x' && (
          <XShareButton
            size="sm"
            text=""
            tweetContent={content}
            title="Auf X teilen"
          />
        )}
        {platform === 'instagram' && (
          <InstagramShareButton
            size="sm"
            text=""
            postContent={content}
            title="Auf Instagram teilen"
          />
        )}
      </div>
    </div>
  ), [content, index, meta, platform, onStartEdit, onSave, onShare])

  const actions = isEditing ? editActions : viewActions
  const editProps = {
    content,
    isEditing,
    editContent,
    onEditContentChange: onEditContentChange || (() => {}),
    actions,
  }

  switch (platform) {
    case 'linkedin':
      return <LinkedInPreview {...editProps} />
    case 'x':
      return <XPreview {...editProps} />
    case 'instagram':
      return <InstagramPreview {...editProps} />
  }
})
