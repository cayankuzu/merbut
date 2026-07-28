import { APP_VERSION } from '../config/version'
import { MerbutMark } from './MerbutMark'

export function MobileUnsupported() {
  return (
    <main className="mobile-unsupported" role="alert" aria-labelledby="mobile-unsupported-title">
      <div className="mobile-unsupported__glow" aria-hidden="true" />
      <section>
        <MerbutMark className="mobile-unsupported__mark" />
        <small>MERBUT · MASAÜSTÜ DENEYİMİ</small>
        <h1 id="mobile-unsupported-title">Bu savaş mobil cihazlarda açılamaz.</h1>
        <p>Kontroller, 3B sahne ve iki kişilik oynanış masaüstü donanımı için tasarlandı.</p>
        <strong>Lütfen masaüstü veya dizüstü bilgisayarınızdaki güncel bir web tarayıcısından girin.</strong>
        <footer>MERBUT · v{APP_VERSION}</footer>
      </section>
    </main>
  )
}
