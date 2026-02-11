import { useState, useCallback, useRef } from 'react'
import type { Platform } from '@/config/platforms'

interface AnimationState {
  isAnimating: boolean
  sourceRect: DOMRect | null
  targetRect: DOMRect | null
  content: string
  platform: Platform
}

const initialState: AnimationState = {
  isAnimating: false,
  sourceRect: null,
  targetRect: null,
  content: '',
  platform: 'linkedin',
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getTargetRect(): DOMRect | null {
  const targets = document.querySelectorAll('[data-save-target]')
  for (const target of targets) {
    const rect = target.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) return rect
  }
  return null
}

export function useSaveAnimation() {
  const [state, setState] = useState<AnimationState>(initialState)
  const [highlighted, setHighlighted] = useState(false)
  const animatingRef = useRef(false)

  const startAnimation = useCallback(
    (sourceEl: HTMLElement, content: string, platform: Platform) => {
      // Skip if already animating (rapid clicks)
      if (animatingRef.current) return false

      // Skip animation if user prefers reduced motion
      if (prefersReducedMotion()) return false

      const sourceRect = sourceEl.getBoundingClientRect()
      const targetRect = getTargetRect()

      // Skip if no target element in DOM
      if (!targetRect) return false

      animatingRef.current = true
      setState({
        isAnimating: true,
        sourceRect,
        targetRect,
        content,
        platform,
      })
      return true
    },
    []
  )

  const onComplete = useCallback(() => {
    animatingRef.current = false
    setState(initialState)

    // Trigger target highlight pulse
    setHighlighted(true)
    setTimeout(() => setHighlighted(false), 800)
  }, [])

  return {
    isAnimating: state.isAnimating,
    sourceRect: state.sourceRect,
    targetRect: state.targetRect,
    animationContent: state.content,
    animationPlatform: state.platform,
    highlighted,
    startAnimation,
    onComplete,
  }
}
