import { useState } from 'react'
import { signInWithEmail } from '@/api/appwrite'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Mail, CheckCircle2, RefreshCw } from 'lucide-react'

export function Auth() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [sentToEmail, setSentToEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      const { error } = await signInWithEmail(email)
      if (error) throw error
      setSentToEmail(email)
      setEmailSent(true)
    } catch (err) {
      toast.error(`Link konnte nicht gesendet werden - ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setLoading(true)
    try {
      const { error } = await signInWithEmail(sentToEmail)
      if (error) throw error
      toast.success('Neuer Link gesendet! - Bitte pruefe deine E-Mail.')
    } catch (err) {
      toast.error(`Fehler beim Senden - ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Login-Link gesendet!</h3>
          <p className="text-sm text-muted-foreground">
            Wir haben dir einen Login-Link an <strong>{sentToEmail}</strong> geschickt.
            Klicke auf den Link in der E-Mail, um dich anzumelden.
          </p>
        </div>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            disabled={loading}
            onClick={handleResend}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Sende...' : 'Keinen Link erhalten? Erneut senden'}
          </Button>
          <button
            type="button"
            className="text-sm text-muted-foreground underline hover:text-foreground transition-colors"
            onClick={() => {
              setEmailSent(false)
              setSentToEmail('')
            }}
          >
            Andere E-Mail verwenden
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">E-Mail</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="deine@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
        <Button type="submit" disabled={loading || !email} className="w-full">
          {loading ? 'Sende Link...' : 'Login-Link anfordern'}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Du erhaeltst einen Login-Link per E-Mail. Kein Passwort noetig.
        </p>
      </form>
    </div>
  )
}
