import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useStore } from '../context/StoreContext'
import { CATEGORIES } from '../data/seed'
import { gsap, Flip, ScrollTrigger, useGSAP, MQ } from '../lib/gsap'
import { whatsappLink } from '../utils/whatsapp'
import ProductCard from './ProductCard'
import { STATUS_STYLES, statusInfo, useStoreStatus } from './StatusBadge'
import { IconWhatsApp } from './Icons'

const reduceMotion = () => window.matchMedia(MQ.reduce).matches
// Categorías "de acompañamiento": se muestran como lista compacta bajo los platos principales.
const SIDE_CATS = ['acompanamientos', 'bebidas']

export default function Menu() {
  const { products, loading, error, config, reload } = useStore()
  const status = useStoreStatus()
  const info = statusInfo(status, config)
  const ms = config.menu_section || {}
  const catLabel = (c) => config.category_labels?.[c.id] || c.label
  const [active, setActive] = useState('all')
  const root = useRef(null)
  const bar = useRef(null)
  const indicator = useRef(null)
  const stickyBar = useRef(null)
  const listStart = useRef(null)
  const flipState = useRef(null)
  const flipAnim = useRef(null)
  const placed = useRef(false)

  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, products.filter((p) => p.category === c.id).length]))
  const filters = [
    { id: 'all', label: ms.all_label || 'Todo', n: products.length },
    ...CATEGORIES.map((c) => ({ ...c, label: catLabel(c), n: counts[c.id] })),
  ]

  // Jerarquía derivada de los datos (sin campos nuevos en la base):
  // el primer "Más pedido" disponible de los platos principales es el destacado.
  const isSide = (p) => SIDE_CATS.includes(p.category)
  const mains = products.filter((p) => !isSide(p))
  const sides = products.filter(isSide)
  const featuredId = mains.find((p) => p.available && p.tags?.includes('mas-pedido'))?.id
  const blocked = status === 'soldout'
  const sideTitle = CATEGORIES.filter((c) => SIDE_CATS.includes(c.id))
    .map(catLabel)
    .join(' · ')

  const visible = (p) => active === 'all' || p.category === active
  const anyVisible = products.some(visible)
  const anyMain = mains.some(visible)
  const anySide = sides.some(visible)

  // Revelado de las tarjetas la primera vez que entran en pantalla: suben y se destapan (clip-path).
  useGSAP(
    () => {
      if (loading) return
      const mm = gsap.matchMedia()
      mm.add(MQ.motion, () => {
        gsap.from('[data-menu-head] > *', {
          y: 30,
          opacity: 0,
          stagger: 0.08,
          scrollTrigger: { trigger: '[data-menu-head]', start: 'top 85%', once: true },
        })
        const cards = gsap.utils.toArray('[data-card]:not(.hidden)')
        gsap.set(cards, { y: 48, opacity: 0, clipPath: 'inset(22% 0% 0% 0% round 16px)' })
        ScrollTrigger.batch(cards, {
          start: 'top 94%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              y: 0,
              opacity: 1,
              clipPath: 'inset(0% 0% 0% 0% round 16px)',
              duration: 1.1,
              stagger: 0.08,
              ease: 'expo.out',
              overwrite: true,
              clearProps: 'clipPath',
            }),
        })
      })
      return () => mm.revert()
    },
    { scope: root, dependencies: [loading] },
  )

  // Indicador deslizante bajo el filtro activo.
  const placeIndicator = (animate) => {
    const el = bar.current?.querySelector(`[data-f="${active}"]`)
    if (!el || !indicator.current) return
    const vars = { x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight }
    if (!animate || reduceMotion()) gsap.set(indicator.current, vars)
    else gsap.to(indicator.current, { ...vars, duration: 0.55, ease: 'expo.out', overwrite: true })
    // En móvil la barra se desliza para dejar visible el filtro elegido.
    const sc = bar.current
    if (sc.scrollWidth > sc.clientWidth) {
      sc.scrollTo({ left: el.offsetLeft - 16, behavior: reduceMotion() ? 'auto' : 'smooth' })
    }
  }

  useLayoutEffect(() => {
    placeIndicator(placed.current)
    placed.current = true
  }, [active, products.length, ms.all_label]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onResize = () => placeIndicator(false)
    window.addEventListener('resize', onResize)
    document.fonts?.ready.then(onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  // Si el cliente está más abajo en la carta, al cambiar de filtro lo llevamos al primer producto
  // (con los filtros a la vista). Si ya está arriba, no movemos nada.
  const scrollToList = () => {
    const mark = listStart.current
    if (!mark) return
    const headerH = parseFloat(getComputedStyle(stickyBar.current).top) || 64
    const barH = stickyBar.current?.offsetHeight || 0
    const target = mark.getBoundingClientRect().top + window.scrollY - headerH - barH - 12
    const dist = window.scrollY - target
    if (dist <= 8) return
    // Distancias largas: salto directo (un scroll suave de varias pantallas marea y lo corta el
    // refresh de ScrollTrigger). Distancias cortas: suave. Las tarjetas igual se animan con Flip.
    const smooth = !reduceMotion() && dist < window.innerHeight * 0.75
    window.scrollTo({ top: target, behavior: smooth ? 'smooth' : 'instant' })
  }

  const choose = (id) => {
    if (id === active) return
    // Clic rápido: termina la transición anterior antes de medir, o se miden posiciones a medio camino.
    flipAnim.current?.progress(1)
    scrollToList()
    if (!reduceMotion()) {
      const cards = root.current.querySelectorAll('[data-card]')
      // Endereza el tilt del mouse antes de medir para que Flip no capture tarjetas inclinadas.
      // También corta entradas/salidas pendientes del cambio anterior (dejarían tarjetas transparentes).
      gsap.killTweensOf(cards, 'rotationX,rotationY,opacity,scale')
      gsap.set(cards, { rotationX: 0, rotationY: 0, scale: 1 })
      gsap.set([...cards].filter((c) => !c.classList.contains('hidden')), { opacity: 1 })
      flipState.current = Flip.getState(cards, { props: 'opacity' })
    }
    setActive(id)
  }

  // Transición entre categorías: las tarjetas se reacomodan (Flip), las nuevas entran, las otras salen.
  useLayoutEffect(() => {
    const state = flipState.current
    if (!state) return
    flipState.current = null
    const targets = root.current.querySelectorAll('[data-card]')
    root.current.dataset.flipping = ''
    // Al terminar (o al cortarla otro clic) cada tarjeta vuelve a su sitio exacto en la grilla:
    // sin esto, el tilt podía reescribir un desplazamiento viejo y dejar tarjetas encimadas.
    const settle = () => {
      gsap.set(targets, { x: 0, y: 0, xPercent: 0, yPercent: 0, scale: 1, rotationX: 0, rotationY: 0 })
      gsap.set([...targets].filter((c) => !c.classList.contains('hidden')), { opacity: 1 })
      delete root.current?.dataset.flipping
      flipAnim.current = null
      ScrollTrigger.refresh()
    }
    flipAnim.current = Flip.from(state, {
      targets,
      duration: 0.65,
      ease: 'power3.inOut',
      scale: true,
      absolute: true,
      stagger: 0.025,
      onEnter: (els) =>
        gsap.fromTo(els, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, y: 0, clipPath: 'none', duration: 0.5, delay: 0.2 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.92, duration: 0.3 }),
      onComplete: settle,
      onInterrupt: settle,
    })
  }, [active])

  const st = STATUS_STYLES[status] || STATUS_STYLES.open

  return (
    <section ref={root} id="menu" className="relative bg-cream py-20 text-carbon sm:py-28" aria-labelledby="menu-title">
      <div className="wrap">
        <div data-menu-head className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="menu-title" className="display text-[clamp(3.2rem,9vw,7rem)]">
              {ms.title}
            </h2>
            {ms.subtitle && <p className="mt-4 max-w-md text-lg text-ink-soft">{ms.subtitle}</p>}
          </div>
        </div>

        {status !== 'open' && (
          <div role="status" className="mt-8 flex items-center gap-3 rounded-2xl border border-carbon/15 bg-white px-5 py-4">
            <span className={`size-2.5 shrink-0 rounded-full ${st.dot}`} aria-hidden="true" />
            <p className="text-[15px]">
              <strong>{info.label}.</strong> {info.hint}
              {blocked ? '' : status === 'scheduling' ? ' Puedes armar tu pedido y elegir la hora al enviarlo.' : ''}
            </p>
          </div>
        )}

        <div ref={stickyBar} className="sticky top-16 z-20 -mx-4 mt-8 bg-cream/90 backdrop-blur sm:mx-0">
          <div
            ref={bar}
            role="toolbar"
            aria-label="Filtrar por categoría"
            className="relative flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:px-0"
          >
            <span
              ref={indicator}
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 rounded-full bg-carbon shadow-[0_8px_20px_-10px_rgb(18_15_13/0.6)]"
            />
            {filters.map((f) => {
              const on = f.id === active
              return (
                <button
                  key={f.id}
                  data-f={f.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => choose(f.id)}
                  className={`relative inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[15px] font-semibold transition-[color,border-color,background-color] duration-300 active:scale-[0.97] ${
                    on ? 'border-transparent bg-transparent text-cream' : 'border-carbon/15 bg-white text-carbon hover:border-carbon/40'
                  }`}
                >
                  {f.label}
                  <span className={`tnum text-xs transition-colors duration-300 ${on ? 'text-gold' : 'text-ink-soft'}`}>{f.n}</span>
                </button>
              )
            })}
          </div>
          {/* Se insinúa que hay más filtros a la derecha (solo cuando la barra desliza) */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-cream to-transparent sm:hidden" />
        </div>

        <div ref={listStart} aria-hidden="true" />

        {error && (
          <div role="alert" className="mt-8 flex flex-col gap-4 rounded-2xl border border-ember/30 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px]">
              <strong>No pudimos cargar la carta.</strong> Revisa tu conexión e inténtalo de nuevo, o pídenos directo por WhatsApp.
            </p>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={reload} className="btn btn-dark min-h-11">
                Reintentar
              </button>
              <a
                href={whatsappLink(config.whatsapp, config.greeting)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn min-h-11 border border-carbon/20 hover:border-carbon/50"
              >
                <IconWhatsApp className="text-[#1a9e4b]" /> WhatsApp
              </a>
            </div>
          </div>
        )}

        {loading ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-[27rem] animate-pulse rounded-2xl bg-cream-2" />
            ))}
          </div>
        ) : (
          <>
            <div className={`mt-8 grid gap-5 sm:grid-cols-2 lg:grid-flow-dense lg:grid-cols-3 ${anyMain ? '' : 'hidden'}`}>
              {mains.map((p) => (
                <ProductCard key={p.id} product={p} hidden={!visible(p)} variant={p.id === featuredId ? 'feature' : 'standard'} blocked={blocked} />
              ))}
            </div>

            {sides.length > 0 && (
              <div className={anySide ? '' : 'hidden'}>
                {anyMain && sideTitle && (
                  <h3 className="mt-16 font-display text-[clamp(2rem,4vw,2.75rem)] leading-none font-black uppercase">{sideTitle}</h3>
                )}
                <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${anyMain ? 'mt-6' : 'mt-8'}`}>
                  {sides.map((p) => (
                    <ProductCard key={p.id} product={p} hidden={!visible(p)} variant="compact" blocked={blocked} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!loading && !anyVisible && <p className="mt-10 text-lg text-ink-soft">{ms.empty_text}</p>}
      </div>
    </section>
  )
}
