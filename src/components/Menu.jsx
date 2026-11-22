import { useLayoutEffect, useRef, useState } from 'react'
import { useStore } from '../context/StoreContext'
import { CATEGORIES } from '../data/seed'
import { gsap, Flip, ScrollTrigger, useGSAP, MQ } from '../lib/gsap'
import ProductCard from './ProductCard'

const reduceMotion = () => window.matchMedia(MQ.reduce).matches

export default function Menu() {
  const { products, loading, error } = useStore()
  const [active, setActive] = useState('all')
  const root = useRef(null)
  const grid = useRef(null)
  const flipState = useRef(null)

  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, products.filter((p) => p.category === c.id).length]))
  const filters = [{ id: 'all', label: 'Todo', n: products.length }, ...CATEGORIES.map((c) => ({ ...c, n: counts[c.id] }))]

  // Revelado escalonado de las tarjetas la primera vez que entran en pantalla.
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
        gsap.set(cards, { y: 60, opacity: 0 })
        ScrollTrigger.batch(cards, {
          start: 'top 92%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { y: 0, opacity: 1, duration: 1, stagger: 0.09, ease: 'expo.out', overwrite: true }),
        })
      })
      return () => mm.revert()
    },
    { scope: root, dependencies: [loading] },
  )

  const choose = (id) => {
    if (id === active) return
    if (!reduceMotion()) flipState.current = Flip.getState('[data-card]', { props: 'opacity' })
    setActive(id)
  }

  // Transición entre categorías: las tarjetas se reacomodan (Flip), las nuevas entran, las otras salen.
  useLayoutEffect(() => {
    const state = flipState.current
    if (!state) return
    flipState.current = null
    Flip.from(state, {
      targets: grid.current.querySelectorAll('[data-card]'),
      duration: 0.65,
      ease: 'power3.inOut',
      scale: true,
      absolute: true,
      stagger: 0.025,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, delay: 0.2 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.92, duration: 0.3 }),
      onComplete: () => ScrollTrigger.refresh(),
    })
  }, [active])

  const visible = (p) => active === 'all' || p.category === active
  const anyVisible = products.some(visible)

  return (
    <section ref={root} id="menu" className="relative bg-cream py-20 text-carbon sm:py-28" aria-labelledby="menu-title">
      <div className="wrap">
        <div data-menu-head className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="menu-title" className="display text-[clamp(3.2rem,9vw,7rem)]">
              La carta
            </h2>
            <p className="mt-4 max-w-md text-lg text-ink-soft">
              Arma tu pedido aquí y lo confirmamos contigo por WhatsApp. Precios en pesos chilenos.
            </p>
          </div>
        </div>

        <div
          role="toolbar"
          aria-label="Filtrar por categoría"
          className="sticky top-16 z-20 -mx-4 mt-10 flex gap-2 overflow-x-auto bg-cream/90 px-4 py-3 backdrop-blur [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        >
          {filters.map((f) => {
            const on = f.id === active
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={on}
                onClick={() => choose(f.id)}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[15px] font-semibold transition-colors duration-200 active:scale-[0.97] ${
                  on
                    ? 'border-carbon bg-carbon text-cream'
                    : 'border-carbon/15 bg-white text-carbon hover:border-carbon/40'
                }`}
              >
                {f.label}
                <span className={`tnum text-xs ${on ? 'text-gold' : 'text-ink-soft'}`}>{f.n}</span>
              </button>
            )
          })}
        </div>

        {error && (
          <p role="alert" className="mt-8 rounded-2xl bg-ember/10 p-4 text-ember-deep">
            No pudimos cargar el menú: {error}
          </p>
        )}

        {loading ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-[27rem] animate-pulse rounded-3xl bg-cream-2" />
            ))}
          </div>
        ) : (
          <div ref={grid} className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} hidden={!visible(p)} />
            ))}
          </div>
        )}

        {!loading && !anyVisible && (
          <p className="mt-10 text-lg text-ink-soft">
            Todavía no hay productos en esta categoría. Prueba con otra o escríbenos por WhatsApp.
          </p>
        )}
      </div>
    </section>
  )
}
