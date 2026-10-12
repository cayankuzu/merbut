import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useStrings } from '../i18n'

interface State {
  error: Error | null
}

function CrashScreen({ error }: { error: Error }) {
  const s = useStrings()
  return (
    <section className="crash-screen" role="alert">
      <small>{s.menu.crashEyebrow}</small>
      <h1>{s.menu.crashTitle}</h1>
      <p>{s.menu.crashBody}</p>
      <code>{error.message}</code>
      <button className="menu-primary" type="button" onClick={() => window.location.reload()}>{s.menu.crashRestart}</button>
    </section>
  )
}

/**
 * A themed crash screen instead of a blank page. The error is kept in the
 * console for bug reports; the player can reload or return to the menu.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[MERBUT] Unexpected error', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return <CrashScreen error={this.state.error} />
  }
}
