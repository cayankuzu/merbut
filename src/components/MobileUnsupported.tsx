import { APP_VERSION } from '../config/version'
import { useStrings } from '../i18n'
import { MerbutMark } from './MerbutMark'

export function MobileUnsupported() {
  const s = useStrings()
  return (
    <main className="mobile-unsupported" role="alert" aria-labelledby="mobile-unsupported-title">
      <div className="mobile-unsupported__glow" aria-hidden="true" />
      <section>
        <MerbutMark className="mobile-unsupported__mark" />
        <small>{s.menu.mobileEyebrow}</small>
        <h1 id="mobile-unsupported-title">{s.menu.mobileTitle}</h1>
        <p>{s.menu.mobileBody}</p>
        <strong>{s.menu.mobileCall}</strong>
        <footer>{s.common.gameTitle} · v{APP_VERSION}</footer>
      </section>
    </main>
  )
}
