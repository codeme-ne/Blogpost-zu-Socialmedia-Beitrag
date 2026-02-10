import { useEffect, useState } from 'react'
import { getCurrentUser, onAuthStateChange } from '@/api/appwrite'
import { toast } from 'sonner'
import { useSearchParams } from 'react-router-dom'

export const useAuth = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    getCurrentUser().then((user) => {
      setUserEmail(user?.email ?? null)
    })
    const { data: sub } = onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null)
      if (session) setLoginOpen(false)
    })
    return () => {
      try {
        if (sub?.subscription) {
          sub.subscription.unsubscribe()
        }
      } catch (error) {
        console.error('Failed to cleanup auth subscription:', error)
      }
    }
  }, [])

  // Show welcome toast once when redirected after signup confirmation
  useEffect(() => {
    const welcome = searchParams.get('welcome')
    if (welcome === '1') {
      const KEY = 'st_welcome_toast_shown'
      const alreadyShown = typeof window !== 'undefined' && window.localStorage.getItem(KEY) === '1'
      if (!alreadyShown) {
        toast.success('Willkommen! - Dein Account ist aktiviert. Viel Spass beim Remixen!')
        try {
          window.localStorage.setItem(KEY, '1')
        } catch {
          // ignore storage errors (private mode etc.)
        }
      }
      // Clean query param without adding a new history entry
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.delete('welcome')
      setSearchParams(newSearchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  return {
    userEmail,
    loginOpen,
    setLoginOpen,
    searchParams,
  }
}
