import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { createJWT, verifyMagicURL } from './api/appwrite.ts'
import { checkRequiredClientVars } from '@/lib/env-validation'

// Validate environment variables on startup
const envValidation = checkRequiredClientVars();
if (!envValidation.isValid) {
  const errorMessage = `Missing required environment variables: ${envValidation.missing.join(', ')}`;
  console.error('Configuration Error:', errorMessage);

  // Create error display using safe DOM methods (no innerHTML to avoid XSS)
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#fee;color:#900;padding:2rem;font-family:monospace;display:flex;align-items:center;justify-content:center;flex-direction:column;z-index:9999;';

  const h1 = document.createElement('h1');
  h1.style.marginBottom = '1rem';
  h1.textContent = 'Configuration Error';

  const pre = document.createElement('pre');
  pre.style.cssText = 'background:#fff;padding:1rem;border-radius:4px;max-width:800px;overflow:auto;';
  pre.textContent = errorMessage;

  const p = document.createElement('p');
  p.style.marginTop = '1rem';
  p.textContent = 'Please check your .env file and ensure all required variables are set.';

  container.append(h1, pre, p);
  document.body.appendChild(container);
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
