import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { createJWT } from '@/api/appwrite'

interface ButtonCheckoutProps {
  priceId: string
  mode?: 'payment' | 'subscription'
  className?: string
  children?: React.ReactNode
  variant?: 'default' | 'outline' | 'secondary'
}

// ShipFast-inspired checkout button
// Automatically handles authentication state and creates Stripe checkout sessions
export function ButtonCheckout({ 
  priceId, 
  mode = 'payment', 
  className = '', 
  children,
  variant = 'default'
}: ButtonCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { userEmail } = useAuth()

  const handleCheckout = async () => {
    setIsLoading(true)

    try {
      // Prepare request headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Add auth token if user is logged in
      if (userEmail) {
        const jwt = await createJWT()
        if (jwt) {
          headers.Authorization = `Bearer ${jwt}`
        }
      }

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          priceId,
          mode,
          successUrl: `${window.location.origin}/app?success=1`,
          cancelUrl: window.location.href,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Checkout creation failed')
      }

      if (!data.url) {
        throw new Error('No checkout URL received')
      }

      // Redirect to Stripe checkout
      window.location.href = data.url
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))
      if (import.meta.env.DEV) console.error('Checkout error:', err)
      toast.error(
        err.message === 'Checkout creation failed'
          ? 'Fehler beim Erstellen der Bezahlung. Bitte versuchen Sie es erneut.'
          : 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading}
      variant={variant}
      className={`group transition-all duration-200 ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Wird geladen...
        </>
      ) : (
        <>
          <Zap className="mr-2 h-4 w-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-200" />
          {children || 'Jetzt kaufen'}
        </>
      )}
    </Button>
  )
}