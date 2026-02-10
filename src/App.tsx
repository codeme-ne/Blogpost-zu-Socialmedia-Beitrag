import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Toaster } from 'sonner'
import CookieConsent from "react-cookie-consent"
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { AuthProvider } from '@/contexts/AuthContext'

// Lazy load all pages for better performance
const Landing = lazy(() => import('@/pages/Landing'))
const Generator = lazy(() => import('@/pages/GeneratorV2'))
const SignUp = lazy(() => import('@/pages/SignUp'))
const Settings = lazy(() => import('@/pages/Settings'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const Imprint = lazy(() => import('@/pages/Imprint'))
const Terms = lazy(() => import('@/pages/Terms'))

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
)

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/imprint" element={<Imprint />} />
          <Route path="/terms" element={<Terms />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Generator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="/auth/verify" element={<PageLoader />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </Suspense>
      <Toaster />
      <CookieConsent
        location="bottom"
        buttonText="Ich verstehe"
        cookieName="socialTransformerCookieConsent"
        style={{ background: "#2B373B" }}
        buttonStyle={{ color: "#4e503b", fontSize: "13px" }}
        expires={150}
      >
        Diese Webseite verwendet Cookies, um die Benutzererfahrung zu verbessern.
      </CookieConsent>
    </ErrorBoundary>
    </AuthProvider>
  )
}