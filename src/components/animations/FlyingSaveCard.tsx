import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { PLATFORM_META, type Platform } from '@/config/platforms'

interface FlyingSaveCardProps {
  sourceRect: DOMRect
  targetRect: DOMRect
  content: string
  platform: Platform
  onComplete: () => void
}

export function FlyingSaveCard({
  sourceRect,
  targetRect,
  content,
  platform,
  onComplete,
}: FlyingSaveCardProps) {
  const meta = PLATFORM_META[platform]
  const targetCenterX = targetRect.left + targetRect.width / 2
  const targetCenterY = targetRect.top + targetRect.height / 2

  const truncated =
    content.length > 120 ? `${content.slice(0, 120)}...` : content

  return createPortal(
    <motion.div
      className="fixed z-[9999] pointer-events-none rounded-lg bg-card shadow-xl overflow-hidden"
      style={{ border: `2px solid ${meta.color}` }}
      initial={{
        left: sourceRect.left,
        top: sourceRect.top,
        width: sourceRect.width,
        height: sourceRect.height,
        opacity: 1,
        scale: 1,
      }}
      animate={{
        left: targetCenterX - sourceRect.width * 0.04,
        top: targetCenterY - sourceRect.height * 0.04,
        width: sourceRect.width,
        height: sourceRect.height,
        opacity: 0.6,
        scale: 0.08,
      }}
      transition={{
        type: 'spring',
        damping: 25,
        stiffness: 300,
      }}
      onAnimationComplete={onComplete}
    >
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs">{meta.emoji}</span>
          <span className="text-xs font-medium" style={{ color: meta.color }}>
            {meta.label}
          </span>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed line-clamp-4">
          {truncated}
        </p>
      </div>
    </motion.div>,
    document.body
  )
}
