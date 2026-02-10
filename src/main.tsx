import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { createJWT, verifyMagicURL } from './api/appwrite.ts'
import { validateClientEnvironment } from '@/lib/env-validation'

// Validate environment variables on startup
const envValidation = validateClientEnvironment();
if (!envValidation.isValid) {
  const errorMessage = `Missing required environment variables: ${envValidation.missing.join(', ')}`;
  console.error('Configuration Error:', errorMessage);

  // Create error display for missing configuration
  const errorDiv = document.createElement('div');
  errorDiv.innerHTML = `
    <div style="
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: #fee; color: #900;
      padding: 2rem; font-family: monospace;
      display: flex; align-items: center; justify-content: center;
      flex-direction: column; z-index: 9999;
    ">
      <h1 style="margin-bottom: 1rem;">Configuration Error</h1>
      <pre style="background: #fff; padding: 1rem; border-radius: 4px; max-width: 800px; overflow: auto;">
${errorMessage}
      </pre>
      <p style="margin-top: 1rem;">Please check your .env file and ensure all required variables are set.</p>
    </div>
  `;
  document.body.appendChild(errorDiv);
  throw new Error('Environment validation failed');
}

// Handles Appwrite Magic URL verification and subscription reconciliation.
// When user clicks a Magic URL link, the URL contains userId and secret params.
export function BootstrapAuthLink() {
  useEffect(() => {
    const url = new URL(window.location.href)
    const userId = url.searchParams.get('userId')
    const secret = url.searchParams.get('secret')

    // Check for Magic URL callback
    if (!userId || !secret) return

    const cleanupParams = () => {
      url.searchParams.delete('userId')
      url.searchParams.delete('secret')
      window.history.replaceState({}, document.title, url.pathname + url.search)
    }

    const attemptReconcile = async () => {
      const jwt = await createJWT()
      if (!jwt) return false
      try {
        const resp = await fetch('/api/reconcile-subscription', {
          method: 'POST',
          headers: { Authorization: `Bearer ${jwt}` },
        })
        const json = await resp.json().catch(() => ({})) as { activated?: number }
        return !!json?.activated
      } catch {
        return false
      }
    }

    // Verify the magic URL session
    verifyMagicURL(userId, secret).then(async ({ error }) => {
      if (error) {
        console.error('Magic URL verification failed:', error)
        cleanupParams()
        return
      }

      const activated = await attemptReconcile()
      cleanupParams()
      window.location.replace(activated ? '/app?welcome=1' : '/app')
    })
  }, [])
  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
  <BootstrapAuthLink />
      <App />
    </BrowserRouter>
  </StrictMode>,
)
