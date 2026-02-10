import { useState } from 'react'
import { signInWithEmail, signUpWithPassword, signInWithPassword, resetPasswordForEmail, createJWT } from '@/api/appwrite'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

type AuthMode = 'login' | 'register' | 'magic-link'

export function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('login')

  // Safely reconcile pending subscription on the server
  const checkPendingSubscription = async () => {
    try {
      const jwt = await createJWT()
      if (!jwt) return

      const resp = await fetch('/api/reconcile-subscription', {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}` },
      })
      const json = await resp.json().catch(() => ({})) as { activated?: number }
      if (json?.activated) {
        toast.success('Ihr Pro-Abo wurde aktiviert! - Sie haben jetzt Zugang zu allen Pro-Features.')
      }
    } catch {
      // Silent failure for subscription reconciliation
    }
  }

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    // Bei Registrierung Passwoerter pruefen
    if (authMode === 'register') {
      if (password.length < 8) {
        toast.error('Passwort zu kurz - Das Passwort muss mindestens 8 Zeichen lang sein.')
        return
      }
      if (password !== passwordConfirm) {
        toast.error('Passwoerter stimmen nicht ueberein - Bitte stelle sicher, dass beide Passwoerter identisch sind.')
        return
      }
    }

    setLoading(true)
    try {
      if (authMode === 'register') {
        const { error, data } = await signUpWithPassword(email, password)
        if (error) {
          const errorMsg = error?.message || String(error)
          if (errorMsg.includes('already') || errorMsg.includes('exist')) {
            toast.error('E-Mail bereits registriert - Diese E-Mail-Adresse ist bereits registriert. Bitte melde dich an oder verwende eine andere E-Mail.')
          } else {
            throw error
          }
        } else if (data?.session) {
          toast.success('Registrierung erfolgreich! - Du wirst automatisch weitergeleitet...')
          await checkPendingSubscription()
        }
      } else {
        const { error, data } = await signInWithPassword(email, password)
        if (error) {
          const errorMsg = error?.message || String(error)
          if (errorMsg.includes('Invalid') || errorMsg.includes('credentials') || errorMsg.includes('password')) {
            toast.error('Anmeldung fehlgeschlagen - E-Mail oder Passwort ist falsch. Bitte ueberpruefe deine Eingaben.')
          } else {
            throw error
          }
        } else if (data?.session) {
          toast.success('Erfolgreich angemeldet! - Du wirst weitergeleitet...')
          await checkPendingSubscription()
        }
      }
    } catch (err) {
      toast.error(`${authMode === 'register' ? 'Registrierung fehlgeschlagen' : 'Login fehlgeschlagen'} - ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      const { error } = await signInWithEmail(email)
      if (error) throw error
      toast.success('Magic Link gesendet - Bitte pruefe deine E-Mail, um dich einzuloggen.')
    } catch (err) {
      toast.error(`Login fehlgeschlagen - ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Auth Mode Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-lg">
        <button
          type="button"
          onClick={() => setAuthMode('login')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
            authMode === 'login'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Anmelden
        </button>
        <button
          type="button"
          onClick={() => setAuthMode('register')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
            authMode === 'register'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Registrieren
        </button>
        <button
          type="button"
          onClick={() => setAuthMode('magic-link')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
            authMode === 'magic-link'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Magic Link
        </button>
      </div>

      {/* Auth Forms */}
      {authMode === 'magic-link' ? (
        <form onSubmit={handleMagicLink} className="space-y-4">
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
            {loading ? 'Sende Link...' : 'Magic Link senden'}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Du erhaeltst einen Login-Link per E-Mail
          </p>
        </form>
      ) : (
        <form onSubmit={handlePasswordAuth} className="space-y-4">
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Passwort</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={authMode === 'register' ? 'Mindestens 8 Zeichen' : 'Dein Passwort'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {authMode === 'register' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Passwort bestaetigen</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  placeholder="Passwort wiederholen"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !email || !password || (authMode === 'register' && !passwordConfirm)}
            className="w-full"
          >
            {loading ? (
              authMode === 'register' ? 'Registriere...' : 'Anmelden...'
            ) : (
              authMode === 'register' ? 'Jetzt registrieren' : 'Anmelden'
            )}
          </Button>

          {authMode === 'login' && (
            <p className="text-xs text-center text-muted-foreground">
              <button
                type="button"
                className="underline hover:text-foreground transition-colors"
                onClick={async () => {
                  if (!email) {
                    toast.error('E-Mail erforderlich - Bitte gib deine E-Mail-Adresse ein, um dein Passwort zurueckzusetzen.')
                    return
                  }
                  try {
                    const { error } = await resetPasswordForEmail(email)
                    if (error) throw error
                    toast.success('E-Mail gesendet! - Pruefe deine E-Mail fuer den Link zum Zuruecksetzen des Passworts.')
                  } catch (err) {
                    toast.error(`Fehler - ${err instanceof Error ? err.message : 'Passwort-Reset fehlgeschlagen'}`)
                  }
                }}
              >
                Passwort vergessen?
              </button>
            </p>
          )}
        </form>
      )}
    </div>
  )
}
