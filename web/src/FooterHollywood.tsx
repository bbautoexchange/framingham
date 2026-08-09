import { useEffect, useState } from 'react'
import { getSiteSettings, subscribeVip } from './api'
import type { SiteSettingsContent } from './types'

type Props = { go: (href: string) => void }
type Status = { type: 'idle' | 'sending' | 'success' | 'error'; message: string }

const fallback: SiteSettingsContent = {
  showroomAddress: '865 Waverly St, Framingham, MA 01701',
  phone: '(508) 306-8170',
  email: 'sales@framinghammotors.com',
  showroomHours: 'Monday–Friday: 9:00 AM–6:00 PM\nSaturday: 10:00 AM–4:00 PM\nSunday: By appointment',
  footerDescription: 'Framingham Motors is focused on retro and classic collectible cars, supported by clear information and personal coordination.',
  footerHoursTitle: 'Showroom Hours',
  footerOperationsTitle: 'Operations',
  footerVipTitle: 'Private VIP List',
  footerVipDescription: 'Receive alerts when a retro or classic vehicle joins the collection.',
}

function phoneHref(value: string) {
  const number = value.replace(/[^\d+]/g, '')
  return number.replace(/\D/g, '').length >= 7 ? `tel:${number}` : undefined
}

function HourRows({ hours }: { hours: string }) {
  return <div className="hollywood-footer-hours">{hours.split(/\r?\n/).filter(Boolean).map((line) => {
    const splitAt = line.indexOf(': ')
    return splitAt > 0
      ? <div key={line}><span>{line.slice(0, splitAt)}</span><b>{line.slice(splitAt + 2)}</b></div>
      : <div key={line}><b>{line}</b></div>
  })}</div>
}

export default function FooterHollywood({ go }: Props) {
  const [settings, setSettings] = useState<SiteSettingsContent>(fallback)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>({ type: 'idle', message: '' })
  useEffect(() => { void getSiteSettings().then((settings) => setSettings((current) => ({ ...current, ...settings }))).catch(() => undefined) }, [])

  const phone = phoneHref(settings.phone)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.showroomAddress)}`
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus({ type: 'sending', message: 'Joining...' })
    try {
      setStatus({ type: 'success', message: await subscribeVip({ email, pageUrl: window.location.href }) })
      setEmail('')
    } catch {
      setStatus({ type: 'error', message: 'Please try again in a moment.' })
    }
  }

  return <footer className="hollywood-footer">
    <div className="hollywood-footer-grid wrap-wide">
      <section className="hollywood-footer-company">
        <button className="hollywood-footer-brand" onClick={() => go('/')} aria-label="Framingham Motors home"><span>FM</span><strong>FRAMINGHAM <em>MOTORS</em></strong><small>INC. · FRAMINGHAM, MASSACHUSETTS</small></button>
        <p>{settings.footerDescription}</p>
        <div className="hollywood-footer-contact">
          <strong>Showroom Address</strong>
          <a href={mapsUrl} target="_blank" rel="noreferrer">{settings.showroomAddress}</a>
          {phone ? <a href={phone}>{settings.phone}</a> : <span>{settings.phone}</span>}
          <a href={`mailto:${settings.email}`}>{settings.email}</a>
        </div>
      </section>
      <section>
        <h2>{settings.footerHoursTitle}</h2>
        <HourRows hours={settings.showroomHours} />
      </section>
      <section className="hollywood-footer-links">
        <h2>{settings.footerOperationsTitle}</h2>
        <button onClick={() => go('/inventory')}>Classic Collection</button>
        <button onClick={() => go('/financing')}>Financing</button>
        <button onClick={() => go('/shipping')}>Transport & Delivery</button>
        <button onClick={() => go('/trade-in')}>Sell or Trade</button>
        <button onClick={() => go('/about')}>About Framingham Motors</button>
        <hr />
        <button onClick={() => go('/privacy')}>Privacy Policy</button>
        <button onClick={() => go('/terms')}>Terms of Service</button>
        <button onClick={() => go('/returns')}>Purchase Terms</button>
      </section>
      <section className="hollywood-footer-vip">
        <h2>{settings.footerVipTitle}</h2>
        <p>{settings.footerVipDescription}</p>
        <form onSubmit={submit}><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email" aria-label="Your email" /><button disabled={status.type === 'sending'}>Join</button></form>
        {status.type !== 'idle' && <small className={`hollywood-footer-status ${status.type}`}>{status.message}</small>}
      </section>
    </div>
    <div className="hollywood-footer-bottom">
      <span>&copy; {new Date().getFullYear()} Framingham Motors, Inc. All rights reserved.</span>
      <div><button onClick={() => go('/privacy')}>Privacy Policy</button><button onClick={() => go('/terms')}>Terms of Service</button><button onClick={() => go('/returns')}>Purchase Terms</button><button onClick={() => go('/admin')}>Admin Access</button></div>
    </div>
  </footer>
}
