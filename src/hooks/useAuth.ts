import { useEffect, useState } from 'react'
import { useAuth as useAuthContext } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { useSearchParams } from 'react-router-dom'

export const useAuth = () => {
  const { user } = useAuthContext()
  const [loginOpen, setLoginOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  const userEmail = user?.email ?? null

  // Close login modal when user signs in
  useEffect(() => {
    if (user) setLoginOpen(false)
  }, [user])

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
