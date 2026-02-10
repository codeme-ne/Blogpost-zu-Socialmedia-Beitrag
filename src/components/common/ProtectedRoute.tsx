import { useEffect, useState, ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getCurrentUser, onAuthStateChange } from '@/api/appwrite'

interface Props {
  children: ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    getCurrentUser().then((user) => setIsAuthed(!!user))
    const result = onAuthStateChange((_event, session) => setIsAuthed(!!session))
    return () => result.data.subscription.unsubscribe()
  }, [])

  if (isAuthed === null) return null
  if (!isAuthed) return <Navigate to="/" replace />
  return children
}
