import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { LevelMap } from '@/components/LevelMap'
import { ChallengeView } from '@/components/ChallengeView'
import { FreePractice } from '@/components/FreePractice'
import { ProgressDashboard } from '@/components/ProgressDashboard'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { LoginScreen } from '@/components/LoginScreen'
import { useAuth } from '@/hooks/useAuth'
import { CapTechLogo } from '@/components/shared/CapTechLogo'

function Footer() {
  return (
    <footer style={{
      background: 'var(--captech-dark-navy)',
      borderTop: 'none',
      padding: '24px',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: '900px', margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em' }}>powered by</span>
          <CapTechLogo color="rgba(255,255,255,0.4)" height={13} />
        </div>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.03em' }}>
          Let's do next together.
        </span>
      </div>
    </footer>
  )
}

export default function App() {
  const { user, revalidate } = useAuth()

  useEffect(() => {
    if (user) revalidate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return <LoginScreen />
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
          <Header user={user} />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<LevelMap />} />
              <Route path="/challenge/:id" element={<ChallengeView />} />
              <Route path="/practice" element={<FreePractice />} />
              <Route path="/progress" element={<ProgressDashboard />} />
              <Route path="*" element={<LevelMap />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
