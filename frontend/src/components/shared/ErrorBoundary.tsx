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
          <h2 style={{ color: '#D94032', marginBottom: '12px' }}>Application Error</h2>
          <pre style={{
            background: '#FEF2F2', border: '1px solid #fca5a5',
            borderRadius: '8px', padding: '16px',
            fontSize: '13px', color: '#7f1d1d',
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
