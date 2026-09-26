import { Component, type ErrorInfo, type ReactNode } from 'react'

interface State {
  error: Error | null
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
    console.error('[MERBUT] Beklenmeyen hata', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <section className="crash-screen" role="alert">
        <small>MERBUT · ZAMAN ÇİZGİSİ KIRILDI</small>
        <h1>Bir şeyler ters gitti</h1>
        <p>Aku zamanı yine karıştırdı. İlerlemen ve ayarların kayıtlı; sayfayı yenileyerek kaldığın diyardan devam edebilirsin.</p>
        <code>{this.state.error.message}</code>
        <button className="menu-primary" type="button" onClick={() => window.location.reload()}>YENİDEN BAŞLAT</button>
      </section>
    )
  }
}
