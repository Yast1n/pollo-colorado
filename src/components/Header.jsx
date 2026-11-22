import { useEffect, useRef, useState } from 'react'
import { useCart } from '../context/CartContext'
import { useStore } from '../context/StoreContext'
import { gsap } from '../lib/gsap'
import { assetUrl } from '../utils/format'
import { IconBag } from './Icons'

export function DefaultMark({ className = 'size-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#EA580C" />
      <path d="M32 10c6 9 15 13 15 26a15 15 0 0 1-30 0c0-7 4-11 7-15 1 5 3 7 6 8-1-7 0-13 2-19z" fill="#120F0D" />
      <path d="M32 34c3 4 6 5 6 10a6 6 0 0 1-12 0c0-3 2-6 6-10z" fill="#F59E0B" />
    </svg>
  )
}

export function Logo({ className = '', href = '#top' }) {
  const { config } = useStore()
  const b = config.brand || {}
  const fullName = `${b.name || ''} ${b.accent || ''}`.trim() || 'Inicio'
  return (
    <a href={href} className={`flex items-center gap-2.5 ${className}`} aria-label={`${fullName}, inicio`}>
      {b.logo_url ? (
        <img src={assetUrl(b.logo_url)} alt="" className="h-9 w-auto max-w-36 object-contain" />
      ) : (
        <DefaultMark />
      )}
      {b.show_name !== false && (
        <span className="font-display text-2xl leading-none font-extrabold tracking-tight uppercase">
          {b.name} {b.accent && <span className="text-ember">{b.accent}</span>}
        </span>
      )}
    </a>
  )
}

export function AnnouncementBar() {
  const { config } = useStore()
  if (!config.announcement_enabled || !config.announcement?.trim()) return null
  return (
    <div className="relative z-50 bg-ember text-carbon">
      <p className="wrap py-2 text-center text-sm font-semibold">{config.announcement}</p>
    </div>
  )
}

export default function Header() {
  const { config } = useStore()
  const { count, setOpen, bump } = useCart()
  const [solid, setSolid] = useState(false)
  const badgeRef = useRef(null)
  const nav = config.nav || {}

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // "Pop" del contador al agregar un producto.
  useEffect(() => {
    if (!bump || !badgeRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(badgeRef.current, { scale: 1.6 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' })
  }, [bump])

  const links = [
    ['#menu', nav.menu],
    ['#secreto', nav.secret],
    ['#visitanos', nav.visit],
  ].filter(([, l]) => l?.trim())

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        solid ? 'border-b border-cream/10 bg-carbon/85 backdrop-blur-md' : 'border-b border-transparent bg-transparent'
      }`}
    >
      <a
        href="#menu"
        className="sr-only z-50 rounded-full bg-gold px-4 py-2 text-carbon focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Saltar al menú
      </a>
      <div className="wrap flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Principal" className="hidden items-center gap-8 text-[15px] font-medium text-ash md:flex">
          {links.map(([href, label]) => (
            <a key={href} className="transition-colors hover:text-cream" href={href}>
              {label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn btn-ghost relative min-h-11 px-4"
          aria-label={`Ver pedido, ${count} ${count === 1 ? 'producto' : 'productos'}`}
        >
          <IconBag />
          <span className="hidden sm:inline">{nav.cart}</span>
          <span
            ref={badgeRef}
            className={`tnum grid min-w-6 place-items-center rounded-full px-1.5 text-xs font-bold ${
              count ? 'bg-ember text-carbon' : 'bg-cream/10 text-ash'
            }`}
          >
            {count}
          </span>
        </button>
      </div>
    </header>
  )
}
