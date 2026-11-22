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
  const { count, setOpen } = useCart()
  const cartRef = useRef(null)
  const [solid, setSolid] = useState(false)
  const badgeRef = useRef(null)
  const nav = config.nav || {}

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // "Pop" del contador cuando la insignia del producto llega al botón.
  useEffect(() => {
    const onPop = () => {
      if (!badgeRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      gsap.fromTo(badgeRef.current, { scale: 1.8 }, { scale: 1, duration: 0.55, ease: 'back.out(3)' })
      gsap.fromTo(cartRef.current, { scale: 1.08 }, { scale: 1, duration: 0.45, ease: 'power3.out' })
    }
    window.addEventListener('pc:cart-pop', onPop)
    return () => window.removeEventListener('pc:cart-pop', onPop)
  }, [])

  const links = [
    ['#menu', nav.menu],
    ['#secreto', nav.secret],
    ['#visitanos', nav.visit],
  ].filter(([, l]) => l?.trim())

  // Header inteligente: arriba es transparente y amplio; al bajar se compacta en una
  // cápsula flotante de vidrio oscuro. La caja externa mantiene su altura (sin saltos de layout).
  return (
    <header className="sticky top-0 z-40 h-16">
      <a
        href="#menu"
        className="sr-only z-50 rounded-full bg-gold px-4 py-2 text-carbon focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Saltar al menú
      </a>
      <div
        className={`mx-auto flex items-center justify-between gap-4 border transition-[max-width,height,margin,padding,background-color,border-color,border-radius,box-shadow,backdrop-filter] duration-500 ease-[var(--ease-out-expo)] ${
          solid
            ? 'mt-2 h-12 max-w-[min(64rem,calc(100%-1.5rem))] rounded-full border-cream/10 bg-carbon/80 px-2 pl-4 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.7)] backdrop-blur-xl backdrop-saturate-150 sm:pl-5'
            : 'mt-0 h-16 max-w-[82rem] rounded-none border-transparent bg-transparent px-[clamp(1rem,4vw,2.5rem)]'
        }`}
      >
        <div className={`origin-left transition-transform duration-500 ease-[var(--ease-out-expo)] ${solid ? 'scale-[0.86]' : ''}`}>
          <Logo />
        </div>
        <nav aria-label="Principal" className="hidden items-center gap-7 text-[15px] font-medium text-ash md:flex">
          {links.map(([href, label]) => (
            <a key={href} className="relative transition-colors hover:text-cream after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-ember after:transition-transform after:duration-300 hover:after:scale-x-100" href={href}>
              {label}
            </a>
          ))}
        </nav>
        <button
          ref={cartRef}
          data-cart-target
          type="button"
          onClick={() => setOpen(true)}
          className={`btn relative px-4 transition-[min-height,background-color,color] ${solid ? 'min-h-9 bg-ember text-carbon hover:bg-gold' : 'btn-ghost min-h-11'}`}
          aria-label={`Ver pedido, ${count} ${count === 1 ? 'producto' : 'productos'}`}
        >
          <IconBag />
          <span className="hidden sm:inline">{nav.cart}</span>
          <span
            ref={badgeRef}
            className={`tnum grid min-w-6 place-items-center rounded-full px-1.5 text-xs font-bold ${
              solid ? 'bg-carbon text-cream' : count ? 'bg-ember text-carbon' : 'bg-cream/10 text-ash'
            }`}
          >
            {count}
          </span>
        </button>
      </div>
    </header>
  )
}
