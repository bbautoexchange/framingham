import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import AdminPage from './AdminPage'
import AboutPageBnb from './AboutPage'
import FinancePageHollywood from './FinancePageHollywood'
import FooterHollywood from './FooterHollywood'
import LegalPageBnb from './LegalPage'
import ShippingPlanner from './ShippingPlanner'
import { defaultTrustedNetwork, getSiteSettings, getTrustedNetwork, getVehicle, getVehicles, submitInquiry, submitTradeIn } from './api'
import type { InquiryForm, SiteSettingsContent, TrustedNetworkContent, Vehicle, VehicleSummary } from './types'

type Page = 'home' | 'inventory' | 'vehicle' | 'financing' | 'shipping' | 'tradein' | 'about' | 'privacy' | 'terms' | 'returns' | 'admin'
type Route = { page: Page; slug?: string }
type Notice = { kind: 'idle' | 'sending' | 'success' | 'error'; message: string }

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const defaultSiteSettings: SiteSettingsContent = {
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
const credentialIcons = ['licensed', 'authorized', 'certified'] as const

function priceOf(vehicle: VehicleSummary) { return vehicle.priceText?.trim() || money.format(vehicle.price) }
function phoneHref(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 7 ? `tel:${digits}` : undefined
}
function mapsHref(address: string) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` }
function parseRoute(pathname: string): Route {
  const vehicle = pathname.match(/^\/inventory\/([^/]+)\/?$/)
  if (vehicle) return { page: 'vehicle', slug: decodeURIComponent(vehicle[1]) }
  const routes: Record<string, Page> = {
    '/inventory': 'inventory', '/financing': 'financing', '/shipping': 'shipping', '/trade-in': 'tradein',
    '/about': 'about', '/privacy': 'privacy', '/terms': 'terms', '/returns': 'returns', '/admin': 'admin',
  }
  return { page: routes[pathname.replace(/\/$/, '')] ?? 'home' }
}

export default function App() {
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname))
  const [site, setSite] = useState<SiteSettingsContent>(defaultSiteSettings)

  useEffect(() => {
    const pop = () => setRoute(parseRoute(window.location.pathname))
    window.addEventListener('popstate', pop)
    return () => window.removeEventListener('popstate', pop)
  }, [])
  useEffect(() => { void getSiteSettings().then((settings) => setSite((current) => ({ ...current, ...settings }))).catch(() => undefined) }, [])

  const go = (path: string) => {
    window.history.pushState({}, '', path)
    setRoute(parseRoute(new URL(path, window.location.origin).pathname))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return <div className="fm-site">
    <Header page={route.page} site={site} go={go} />
    <main className="fm-main">
      {route.page === 'home' && <Home site={site} go={go} />}
      {route.page === 'inventory' && <Inventory go={go} />}
      {route.page === 'vehicle' && <VehiclePage slug={route.slug ?? ''} go={go} />}
      {route.page === 'financing' && <FinancePageHollywood go={go} />}
      {route.page === 'shipping' && <ShippingPlanner go={go} />}
      {route.page === 'tradein' && <TradeInPage go={go} />}
      {route.page === 'about' && <AboutPageBnb go={go} />}
      {(['privacy', 'terms', 'returns'] as Page[]).includes(route.page) && <LegalPageBnb page={route.page as 'privacy' | 'terms' | 'returns'} go={go} />}
      {route.page === 'admin' && <AdminPage />}
    </main>
    {route.page !== 'admin' && <FooterHollywood go={go} />}
    {route.page !== 'admin' && <a className="fm-floating-call" href={phoneHref(site.phone)} aria-label={`Call Framingham Motors at ${site.phone}`}><ContactIcon name="phone" /> <span>Call</span></a>}
  </div>
}

function Header({ page, site, go }: { page: Page; site: SiteSettingsContent; go: (path: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const active = (item: Page | 'vehicle') => page === item || (item === 'inventory' && page === 'vehicle') ? 'active' : ''
  const navigate = (path: string) => { setMenuOpen(false); go(path) }
  return <header className="fm-header"><div className="fm-container fm-header-inner">
    <button className="fm-brand" onClick={() => navigate('/')} aria-label="Framingham Motors home"><span className="fm-brand-mark">FM</span><span><strong>FRAMINGHAM <em>MOTORS</em></strong><small>INC. · FRAMINGHAM, MASSACHUSETTS</small></span></button>
    <button className="fm-menu-toggle" type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="fm-primary-nav"><span /><span /><span /><b>Menu</b></button>
    <nav id="fm-primary-nav" className={`fm-nav${menuOpen ? ' open' : ''}`} aria-label="Main navigation"><button className={active('home')} onClick={() => navigate('/')}>Home</button><button className={active('inventory')} onClick={() => navigate('/inventory')}>Inventory</button><button className={active('financing')} onClick={() => navigate('/financing')}>Financing</button><button className={active('shipping')} onClick={() => navigate('/shipping')}>Transport</button><button className={active('about')} onClick={() => navigate('/about')}>About</button><button className={active('tradein')} onClick={() => navigate('/trade-in')}>Trade-in</button></nav>
    <div className="fm-header-actions"><a className="fm-phone" href={phoneHref(site.phone)}><ContactIcon name="phone" /> <span>Sales {site.phone}</span></a><button className="fm-button fm-button-small" onClick={() => navigate('/financing')}>Get pre-approved</button></div>
  </div></header>
}

function Home({ site, go }: { site: SiteSettingsContent; go: (path: string) => void }) {
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([])
  const [trustedNetwork, setTrustedNetwork] = useState<TrustedNetworkContent>(defaultTrustedNetwork)
  useEffect(() => { void getVehicles().then(setVehicles).catch(() => setVehicles([])) }, [])
  useEffect(() => { void getTrustedNetwork().then(setTrustedNetwork).catch(() => undefined) }, [])
  return <>
    <section className="fm-hero"><div className="fm-container fm-hero-inner"><div className="fm-hero-card"><p className="fm-kicker fm-kicker-light">Classic & collectible vehicles · Framingham, Massachusetts</p><h1>DRIVE TOMORROW,<br /><em>TODAY.</em></h1><p>Explore a considered collection of retro and classic vehicles, with the information and planning tools to move forward confidently.</p><div className="fm-actions"><button className="fm-button" onClick={() => go('/inventory')}>View inventory</button><a className="fm-button fm-button-ghost fm-icon-button" href={phoneHref(site.phone)}><ContactIcon name="phone" />Call a specialist</a></div></div></div></section>
    <SectionHeading eyebrow="Current collection" title="New Arrivals" lead="Browse the vehicles currently published by Framingham Motors." />
    <section className="fm-container fm-featured"><div className="fm-car-grid">{vehicles.slice(0, 3).map((vehicle) => <VehicleCard key={vehicle.slug} vehicle={vehicle} go={go} />)}</div>{!vehicles.length && <p className="fm-loading">Inventory is being updated. Please check back shortly.</p>}<div className="fm-centered"><button className="fm-outline-button" onClick={() => go('/inventory')}>Browse full inventory →</button></div></section>
    <section className="fm-trust-bar"><div className="fm-container fm-trust-items"><span>Current vehicle details</span><span>Finance request tools</span><span>Nationwide transport planning</span><span>Trade-in appraisal requests</span></div></section>
    <section className="fm-container fm-stats">{trustedNetwork.metrics.slice(0, 4).map((metric) => <Stat key={`${metric.value}-${metric.label}`} value={metric.value} label={metric.label} note={metric.detail} />)}</section>
    <SectionHeading eyebrow={trustedNetwork.eyebrow} title={trustedNetwork.title} lead={trustedNetwork.description} />
    <section className="fm-container"><div className="fm-credentials">{trustedNetwork.credentials.slice(0, 3).map((credential, index) => <Credential key={`${credential.title}-${credential.status}`} icon={credentialIcons[index] ?? 'certified'} title={credential.title} description={credential.detail} status={credential.status} />)}</div><div className="fm-partners">{trustedNetwork.partners.map((partner) => <div key={`${partner.mark}-${partner.name}`}>{partner.image ? <img src={partner.image} alt={partner.name} loading="lazy" /> : <span className="fm-partner-mark">{partner.mark}</span>}<small>{partner.name}</small></div>)}</div></section>
    <section className="fm-services"><div className="fm-container"><SectionHeading eyebrow="Services" title="A Clear Way Forward" /><div className="fm-service-grid"><Service title="Inventory guidance" text="Ask for the information you need about a current vehicle before taking the next step." /><Service title="Finance planning" text="Use the payment estimator and send a pre-approval request to start a lender conversation." /><Service title="Transport coordination" text="Build a route estimate from the Framingham pickup point to your destination." /><Service title="Trade-in appraisal" text="Share your current vehicle details for a straightforward trade-in or sell request." /></div></div></section>
    <section className="fm-container fm-trade-banner"><div><p className="fm-kicker fm-kicker-red">Trade-in & sell</p><h2>Make Your Next Move</h2><p>Tell us about your current vehicle and start a trade-in or purchase conversation through the same Framingham Motors team.</p><button className="fm-white-button" onClick={() => go('/trade-in')}>Request an appraisal →</button></div><img src="/framingham/trade-in.jpg" alt="Classic vehicle available for appraisal" /></section>
    <section className="fm-philosophy"><div className="fm-container fm-philosophy-inner"><div><p className="fm-kicker fm-kicker-red">Our focus</p><h2>The Retro Collectible Standard</h2><p>Framingham Motors, Inc. is focused on retro and classic collectible cars. Our storefront keeps the key purchase paths connected: availability, financing, delivery, and trade-in support.</p><p>Start with the vehicle, then choose the next step that makes sense for your timing.</p></div><img src="/framingham/philosophy.jpg" alt="Classic car at Framingham Motors" /></div></section>
    <section className="fm-container fm-map"><div><strong>Framingham Motors, Inc. Showroom</strong><span>{site.showroomAddress}</span><a href={mapsHref(site.showroomAddress)} target="_blank" rel="noreferrer">Open in Google Maps →</a></div><iframe title="Framingham Motors location" src={`https://www.google.com/maps?q=${encodeURIComponent(site.showroomAddress)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></section>
  </>
}

function Inventory({ go }: { go: (path: string) => void }) {
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([])
  const [query, setQuery] = useState('')
  const [make, setMake] = useState('')
  const [price, setPrice] = useState('')
  useEffect(() => { void getVehicles().then(setVehicles).catch(() => setVehicles([])) }, [])
  const makes = useMemo(() => Array.from(new Set(vehicles.map((vehicle) => vehicle.make))).sort(), [vehicles])
  const filtered = useMemo(() => vehicles.filter((vehicle) => {
    const searchable = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.exteriorColor}`.toLowerCase()
    const matchesPrice = !price || (price === 'low' ? vehicle.price < 80000 : price === 'mid' ? vehicle.price >= 80000 && vehicle.price < 120000 : vehicle.price >= 120000)
    return (!make || vehicle.make === make) && matchesPrice && searchable.includes(query.trim().toLowerCase())
  }), [vehicles, query, make, price])
  return <section className="fm-page fm-container"><SectionHeading eyebrow="Available now" title="Classic & Retro Inventory" lead="Current public listings from Framingham Motors." /><div className="fm-filters"><label>Search<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Year, make, model, or color" /></label><label>Manufacturer<select value={make} onChange={(event) => setMake(event.target.value)}><option value="">All makes</option>{makes.map((item) => <option key={item}>{item}</option>)}</select></label><label>Price range<select value={price} onChange={(event) => setPrice(event.target.value)}><option value="">Any price</option><option value="low">Under $80,000</option><option value="mid">$80,000–$120,000</option><option value="high">$120,000+</option></select></label><strong>{filtered.length} vehicle{filtered.length === 1 ? '' : 's'} available</strong></div><div className="fm-car-grid">{filtered.map((vehicle) => <VehicleCard key={vehicle.slug} vehicle={vehicle} go={go} />)}</div>{!filtered.length && <p className="fm-empty">No vehicles match your current filters.</p>}</section>
}

function VehicleCard({ vehicle, go }: { vehicle: VehicleSummary; go: (path: string) => void }) {
  return <article className="fm-car-card"><button className="fm-card-image" onClick={() => go(`/inventory/${vehicle.slug}`)}><img src={vehicle.imageUrl} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} loading="lazy" /><span>Available now</span></button><div><p>{vehicle.year} · {vehicle.make}</p><h3>{vehicle.model}</h3><small>{vehicle.mileage.toLocaleString()} mi · {vehicle.exteriorColor}</small><strong>{priceOf(vehicle)}</strong><button onClick={() => go(`/inventory/${vehicle.slug}`)}>View vehicle <b>→</b></button></div></article>
}

function VehiclePage({ slug, go }: { slug: string; go: (path: string) => void }) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [activeImage, setActiveImage] = useState(0)
  const [notice, setNotice] = useState<Notice>({ kind: 'idle', message: '' })
  useEffect(() => {
    setVehicle(null)
    setActiveImage(0)
    void getVehicle(slug).then(setVehicle).catch((reason: Error) => setNotice({ kind: 'error', message: reason.message }))
  }, [slug])
  if (!vehicle) return <section className="fm-page fm-container"><p className="fm-loading">{notice.message || 'Loading vehicle…'}</p></section>
  const inquiry: InquiryForm = { firstName: '', lastName: '', email: '', phone: '', vehicleSlug: vehicle.slug, message: `I am interested in the ${vehicle.year} ${vehicle.make} ${vehicle.model}.`, pageUrl: window.location.href }
  return <section className="fm-page fm-container"><button className="fm-back" onClick={() => go('/inventory')}>← Back to inventory</button><div className="fm-detail-heading"><div><p className="fm-kicker">Current collection</p><h1>{vehicle.year} {vehicle.make}<br /><em>{vehicle.model}</em></h1><span>Stock {vehicle.stockNumber} · {vehicle.location}</span></div><strong>{priceOf(vehicle)}</strong></div><div className="fm-detail-layout"><div className="fm-gallery"><img className="fm-main-photo" src={vehicle.imageUrls[activeImage] ?? vehicle.imageUrl} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} /><div>{vehicle.imageUrls.map((url, index) => <button className={index === activeImage ? 'active' : ''} key={url} onClick={() => setActiveImage(index)}><img src={url} alt={`View ${index + 1}`} loading="lazy" /></button>)}</div></div><aside><p>{vehicle.description}</p><dl><div><dt>VIN</dt><dd>{vehicle.vin || 'Available on request'}</dd></div><div><dt>Mileage</dt><dd>{vehicle.mileage.toLocaleString()} mi</dd></div><div><dt>Engine</dt><dd>{vehicle.engine}</dd></div><div><dt>Transmission</dt><dd>{vehicle.transmission}</dd></div><div><dt>Exterior / interior</dt><dd>{vehicle.exteriorColor} / {vehicle.interiorColor}</dd></div></dl><button className="fm-button" onClick={() => document.getElementById('inquire')?.scrollIntoView({ behavior: 'smooth' })}>Check availability</button><button className="fm-outline-button" onClick={() => go(`/financing?price=${vehicle.price}&vehicle=${encodeURIComponent(vehicle.slug)}`)}>Plan financing</button><button className="fm-outline-button" onClick={() => go(`/shipping?vehicle=${encodeURIComponent(vehicle.slug)}`)}>Plan transport</button></aside></div><section className="fm-highlights"><h2>Vehicle highlights</h2><ul>{vehicle.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul></section><InquiryFormBox initial={inquiry} status={notice} setStatus={setNotice} /></section>
}

function InquiryFormBox({ initial, status, setStatus }: { initial: InquiryForm; status: Notice; setStatus: (value: Notice) => void }) {
  const [form, setForm] = useState(initial)
  const update = (field: keyof InquiryForm, value: string) => setForm((current) => ({ ...current, [field]: value }))
  const submit = async (event: FormEvent) => { event.preventDefault(); setStatus({ kind: 'sending', message: 'Sending your inquiry…' }); try { setStatus({ kind: 'success', message: await submitInquiry(form) }) } catch (reason) { setStatus({ kind: 'error', message: message(reason) }) } }
  return <form id="inquire" className="fm-lead-form" onSubmit={submit}><p className="fm-kicker">Request details</p><h2>Talk to a specialist</h2><div className="fm-form-grid"><Input label="First name" value={form.firstName} onChange={(value) => update('firstName', value)} /><Input label="Last name" value={form.lastName} onChange={(value) => update('lastName', value)} /><Input label="Email" type="email" value={form.email} onChange={(value) => update('email', value)} /><Input label="Phone" type="tel" value={form.phone} onChange={(value) => update('phone', value)} /></div><label>Message<textarea value={form.message} onChange={(event) => update('message', event.target.value)} /></label><button className="fm-button" disabled={status.kind === 'sending'}>Send inquiry</button><FormNotice notice={status} /></form>
}

function TradeInPage({ go }: { go: (path: string) => void }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', year: 1970, make: '', model: '', mileage: 0, condition: 'Excellent', message: '', pageUrl: window.location.href })
  const [notice, setNotice] = useState<Notice>({ kind: 'idle', message: '' })
  const update = (field: keyof typeof form, value: string | number) => setForm((current) => ({ ...current, [field]: value }))
  const submit = async (event: FormEvent) => { event.preventDefault(); setNotice({ kind: 'sending', message: 'Sending your appraisal request…' }); try { setNotice({ kind: 'success', message: await submitTradeIn(form) }) } catch (reason) { setNotice({ kind: 'error', message: message(reason) }) } }
  return <Page title="Trade-In or Sell" eyebrow="Framingham Motors" lead="Share the key details of your current vehicle to start a trade-in or purchase conversation."><form className="fm-lead-form fm-wide-form" onSubmit={submit}><div className="fm-form-grid"><Input label="First name" value={form.firstName} onChange={(value) => update('firstName', value)} /><Input label="Last name" value={form.lastName} onChange={(value) => update('lastName', value)} /><Input label="Email" type="email" value={form.email} onChange={(value) => update('email', value)} /><Input label="Phone" type="tel" value={form.phone} onChange={(value) => update('phone', value)} /><NumberInput label="Year" value={form.year} setValue={(value) => update('year', value)} /><Input label="Make" value={form.make} onChange={(value) => update('make', value)} /><Input label="Model" value={form.model} onChange={(value) => update('model', value)} /><NumberInput label="Mileage" value={form.mileage} setValue={(value) => update('mileage', value)} /></div><label>Condition<select value={form.condition} onChange={(event) => update('condition', event.target.value)}>{['Concours / show quality', 'Excellent', 'Very good', 'Good driver', 'Fair', 'Project / restoration'].map((item) => <option key={item}>{item}</option>)}</select></label><label>Anything else we should know?<textarea value={form.message} onChange={(event) => update('message', event.target.value)} /></label><button className="fm-button" disabled={notice.kind === 'sending'}>Request trade-in value</button><FormNotice notice={notice} /></form><button className="fm-back" onClick={() => go('/inventory')}>← View inventory</button></Page>
}

function Page({ title, eyebrow, lead, children }: { title: string; eyebrow: string; lead: string; children: ReactNode }) { return <section className="fm-page fm-container"><header className="fm-page-heading"><p className="fm-kicker">{eyebrow}</p><h1>{title}</h1><p>{lead}</p></header>{children}</section> }
function SectionHeading({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: string }) { return <header className="fm-section-heading fm-container"><p className="fm-kicker">{eyebrow}</p><h2>{title}</h2>{lead && <p>{lead}</p>}</header> }
function Stat({ value, label, note }: { value: string; label: string; note: string }) { return <article><strong>{value}</strong><span>{label}</span><small>{note}</small></article> }
function Credential({ icon, title, description, status }: { icon: 'licensed' | 'authorized' | 'certified'; title: string; description: string; status: string }) { return <article><img className="fm-trust-icon" src={`/trust-icons/${icon}.svg`} alt="" /><div><strong>{title}</strong><small>{description}</small></div><b>{status}</b></article> }
function Service({ title, text }: { title: string; text: string }) { return <article><span>◇</span><h3>{title}</h3><p>{text}</p></article> }
function Input({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) { return <label>{label}<input required value={value} type={type} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label> }
function NumberInput({ label, value, setValue, prefix, suffix, step = 1 }: { label: string; value: number; setValue: (value: number) => void; prefix?: string; suffix?: string; step?: number }) { return <label>{label}<span className="fm-number-input">{prefix}<input type="number" min="0" step={step} value={Number.isFinite(value) ? value : 0} onChange={(event) => setValue(Number(event.target.value))} />{suffix}</span></label> }
function FormNotice({ notice }: { notice: Notice }) { return notice.kind === 'idle' ? null : <p className={`fm-notice ${notice.kind}`} role="status">{notice.message}</p> }
function message(reason: unknown) { return reason instanceof Error ? reason.message : 'Please try again in a moment.' }
function ContactIcon({ name }: { name: 'location' | 'phone' | 'email' | 'hours' }) { return <img className={`fm-contact-icon fm-contact-icon-${name}`} src={`/contact-icons/${name}.png`} alt="" aria-hidden="true" /> }
