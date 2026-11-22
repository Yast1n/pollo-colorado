import { useEffect, useRef } from 'react'
import { useCart } from '../context/CartContext'
import { useStore } from '../context/StoreContext'
import { TAGS } from '../data/seed'
import { gsap, MQ, prefersReduced } from '../lib/gsap'
import { assetUrl, formatCLP } from '../utils/format'
import { IconPlus, IconScale, IconUsers } from './Icons'

const TAG_STYLE = {
  'mas-pedido': 'bg-gold text-carbon',
  ultimas: 'bg-cream text-ember-deep',
  nuevo: 'bg-cream text-carbon',
  promo: 'bg-ember text-carbon',
}

export default function ProductCard({ product, hidden }) {
  const { add } = useCart()
  const { config } = useStore()
  const ms = config.menu_section || {}
  const soldLabel = ms.soldout_label || 'Agotado'
  const btn = useRef(null)
  const card = useRef(null)
  const soldOut = !product.available
  const tags = soldOut ? [] : product.tags
  const img = assetUrl(product.image_url) || assetUrl('images/productos/pollo-entero.svg')

  // Tilt 3D suave + brillo que sigue al cursor (solo mouse y con movimiento permitido).
  useEffect(() => {
    const el = card.current
    const mq = window.matchMedia(`${MQ.motion} and ${MQ.fine}`)
    if (!el || !mq.matches) return
    gsap.set(el, { transformPerspective: 900 })
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' })
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' })
    const move = (e) => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      ry((px - 0.5) * 9)
      rx((0.5 - py) * 7)
      el.style.setProperty('--mx', `${px * 100}%`)
      el.style.setProperty('--my', `${py * 100}%`)
    }
    const leave = () => {
      rx(0)
      ry(0)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      gsap.set(el, { rotationX: 0, rotationY: 0 })
    }
  }, [])

  const onAdd = () => {
    add(product.id)
    const pop = () => window.dispatchEvent(new CustomEvent('pc:cart-pop'))
    const target = document.querySelector('[data-cart-target]')
    if (prefersReduced() || !target) return pop()

    // Feedback táctil del botón.
    gsap.fromTo(btn.current, { scale: 0.88 }, { scale: 1, duration: 0.5, ease: 'back.out(4)' })
    navigator.vibrate?.(12)

    // Insignia con la foto del producto que vuela en arco hasta "Tu pedido".
    const from = btn.current.getBoundingClientRect()
    const to = target.getBoundingClientRect()
    const size = 52
    const chip = document.createElement('div')
    chip.setAttribute('aria-hidden', 'true')
    chip.style.cssText = `position:fixed;z-index:80;left:${from.left + from.width / 2 - size / 2}px;top:${
      from.top + from.height / 2 - size / 2
    }px;width:${size}px;height:${size}px;border-radius:999px;overflow:hidden;pointer-events:none;box-shadow:0 0 0 3px #EA580C,0 10px 30px rgba(234,88,12,.55);background:#120F0D`
    chip.innerHTML = `<img src="${img}" alt="" style="width:100%;height:100%;object-fit:cover">`
    document.body.appendChild(chip)
    const dx = to.left + to.width / 2 - (from.left + from.width / 2)
    const dy = to.top + to.height / 2 - (from.top + from.height / 2)
    gsap
      .timeline({ onComplete: () => (chip.remove(), pop()) })
      .from(chip, { scale: 0, duration: 0.25, ease: 'back.out(3)' })
      .to(chip, { x: dx, duration: 0.75, ease: 'power2.in' }, 0.15)
      .to(chip, { y: dy, duration: 0.75, ease: 'back.in(1.6)' }, 0.15)
      .to(chip, { scale: 0.3, opacity: 0.6, duration: 0.75, ease: 'power2.in' }, 0.15)
  }

  return (
    <article
      ref={card}
      data-card
      data-flip-id={product.id}
      className={`group relative flex will-change-transform flex-col overflow-hidden rounded-3xl bg-white shadow-[0_1px_0_rgb(18_15_13/0.06),0_18px_40px_-28px_rgb(18_15_13/0.45)] ${
        hidden ? 'hidden' : ''
      }`}
    >
      {/* Brillo que sigue al cursor */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'radial-gradient(420px circle at var(--mx,50%) var(--my,50%), rgb(255 255 255 / 0.16), transparent 45%)' }}
      />
      <div className="relative aspect-[4/3] overflow-hidden bg-carbon">
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          decoding="async"
          width="800"
          height="600"
          className={`size-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.07] ${
            soldOut ? 'opacity-45 grayscale' : ''
          }`}
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {soldOut && (
            <span className="rounded-full bg-carbon px-3 py-1 text-xs font-bold text-cream">{soldLabel}</span>
          )}
          {tags.map((t) => (
            <span key={t} className={`rounded-full px-3 py-1 text-xs font-bold ${TAG_STYLE[t] || 'bg-cream text-carbon'}`}>
              {config.tag_labels?.[t] || TAGS.find((x) => x.id === t)?.label || t}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-display text-[1.85rem] leading-[0.95] font-extrabold text-carbon">{product.name}</h3>

        {(product.weight_label || product.portions) && (
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
            {product.weight_label && (
              <li className="inline-flex items-center gap-1.5">
                <IconScale width="16" height="16" /> {product.weight_label}
              </li>
            )}
            {product.portions && (
              <li className="inline-flex items-center gap-1.5">
                <IconUsers width="16" height="16" /> {product.portions}
              </li>
            )}
          </ul>
        )}

        <p className="mt-3 flex-1 text-[15px] leading-relaxed text-ink-soft">{product.description}</p>

        <div className="relative mt-5 flex items-center justify-between gap-3">
          <p className="tnum font-display text-3xl font-black text-carbon">{formatCLP(product.price)}</p>
          <button
            ref={btn}
            type="button"
            onClick={onAdd}
            disabled={soldOut}
            className="btn btn-dark min-h-11 px-5 disabled:cursor-not-allowed disabled:bg-carbon/10 disabled:text-ink-soft"
            aria-label={soldOut ? `${product.name} agotado` : `Agregar ${product.name} al pedido`}
          >
            {soldOut ? (
              soldLabel
            ) : (
              <>
                <IconPlus width="18" height="18" /> {ms.add_label || 'Agregar'}
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}
