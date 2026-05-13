import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { LevelMap } from '@/components/LevelMap'
import { ChallengeView } from '@/components/ChallengeView'
import { ProgressDashboard } from '@/components/ProgressDashboard'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { LoginScreen } from '@/components/LoginScreen'
import { FacilitatorResponses } from '@/components/FacilitatorResponses'
import { FacilitatorLeaderboard } from '@/components/FacilitatorLeaderboard'
import { useAuth } from '@/hooks/useAuth'
import { CapTechLogo } from '@/components/shared/CapTechLogo'

function Footer() {
  return (
    <footer style={{
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      padding: '20px 24px',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: '900px', margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>powered by</span>
          <CapTechLogo color="var(--captech-blue)" height={18} />
        </div>
        <span style={{ fontSize: 'var(--fs-small)', color: 'var(--ink-3)' }}>
          Let's do next together.
        </span>
      </div>
    </footer>
  )
}

function AuthenticatedApp() {
  const { user } = useAuth()
  if (!user) return <LoginScreen />
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
      <Header user={user} />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<LevelMap />} />
          <Route path="/challenge/:id" element={<ChallengeView />} />
          <Route path="/progress" element={<ProgressDashboard />} />
          <Route path="*" element={<LevelMap />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/facilitator/responses" element={<FacilitatorResponses />} />
          <Route path="/facilitator/leaderboard" element={<FacilitatorLeaderboard />} />
          <Route path="*" element={<AuthenticatedApp />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
