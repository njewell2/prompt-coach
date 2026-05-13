import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '40px 24px', maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ color: 'var(--score-low)', marginBottom: '12px' }}>Application Error</h2>
          <pre style={{
            background: 'var(--score-low-bg)',
            border: '1px solid var(--score-low)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            fontSize: 'var(--fs-small)',
            color: 'var(--score-low)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
