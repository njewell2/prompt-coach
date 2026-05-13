import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from '@/hooks/useAuth'
import { ProgressProvider } from '@/hooks/useProgress'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ProgressProvider>
        <App />
      </ProgressProvider>
    </AuthProvider>
  </React.StrictMode>
)
