import { useEffect, useRef } from 'react'
import { useCart } from '../context/CartContext'
import { useStore } from '../context/StoreContext'
import { TAGS } from '../data/seed'
import { gsap, MQ, prefersReduced } from '../lib/gsap'
import { assetUrl, formatCLP } from '../utils/format'
import { IconMinus, IconPlus, IconScale, IconUsers } from './Icons'

const TAG_STYLE = {
  'mas-pedido': 'bg-gold text-carbon',
  ultimas: 'bg-cream text-ember-deep',
  nuevo: 'bg-cream text-carbon',
  promo: 'bg-ember text-carbon',
}

// Destino del vuelo: en móvil, la barra inferior "Ver pedido" (si ya existe); si no, el botón del header.
function cartTarget() {
  if (window.matchMedia('(max-width: 767px)').matches) {
    const m = document.querySelector('[data-cart-target-mobile]')
    if (m) return m
  }
  return document.querySelector('[data-cart-target]')
}

/**
 * variant:
 *  - feature: el destacado de la carta (ocupa 2 columnas, foto grande)
 *  - standard: pollos y combos
 *  - compact: acompañamientos y bebidas (fila horizontal, foto chica)
 * blocked: el local está "Agotado por hoy" → no se puede agregar nada.
 */
export default function ProductCard({ product, hidden, variant = 'standard', blocked = false }) {
  const { add, setQty, items } = useCart()
  const { config } = useStore()
  const ms = config.menu_section || {}
  const soldLabel = ms.soldout_label || 'Agotado'
  const btn = useRef(null)
  const card = useRef(null)
  const stepper = useRef(null)
  const soldOut = !product.available
  const canAdd = !soldOut && !blocked
  const tags = soldOut ? [] : product.tags || []
  const img = assetUrl(product.image_url) || assetUrl('images/productos/pollo-entero.svg')
  const qty = items.find((i) => i.id === product.id)?.qty || 0
  const prevQty = useRef(qty)
  const compact = variant === 'compact'
  const feature = variant === 'feature'

  // Tilt 3D suave + brillo que sigue al cursor (solo mouse y con movimiento permitido).
  useEffect(() => {
    const el = card.current
    const mq = window.matchMedia(`${MQ.motion} and ${MQ.fine}`)
    if (!el || !mq.matches || compact) return
    gsap.set(el, { transformPerspective: 900 })
    const amp = feature ? 0.45 : 1 // la tarjeta grande se inclina menos
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' })
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' })
    const move = (e) => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      ry((px - 0.5) * 9 * amp)
      rx((0.5 - py) * 7 * amp)
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
  }, [compact, feature])

  // El botón "Agregar" se transforma en selector de cantidad (− n +) al primer agregado.
  useEffect(() => {
    const was = prevQty.current
    prevQty.current = qty
    if (prefersReduced() || !stepper.current) return
    if (was === 0 && qty > 0) {
      gsap.fromTo(
        stepper.current,
        { clipPath: 'inset(0% 0% 0% 70% round 999px)', opacity: 0.4 },
        { clipPath: 'inset(0% 0% 0% 0% round 999px)', opacity: 1, duration: 0.5, ease: 'expo.out', clearProps: 'clipPath' },
      )
    } else if (qty !== was && qty > 0) {
      gsap.fromTo(stepper.current.querySelector('[data-qty]'), { yPercent: qty > was ? 60 : -60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.35, ease: 'expo.out' })
    }
  }, [qty])

  const fly = (origin) => {
    const pop = () => window.dispatchEvent(new CustomEvent('pc:cart-pop'))
    const target = cartTarget()
    if (prefersReduced() || !target || !origin) return pop()

    gsap.fromTo(origin, { scale: 0.88 }, { scale: 1, duration: 0.5, ease: 'back.out(4)' })
    navigator.vibrate?.(12)

    // Insignia con la foto del producto que vuela en arco hasta el pedido.
    const from = origin.getBoundingClientRect()
    const to = target.getBoundingClientRect()
    const size = 52
    const chip = document.createElement('div')
    chip.setAttribute('aria-hidden', 'true')
    chip.style.cssText = `position:fixed;z-index:80;left:${from.left + from.width / 2 - size / 2}px;top:${
      from.top + from.height / 2 - size / 2
    }px;width:${size}px;height:${size}px;border-radius:999px;overflow:hidden;pointer-events:none;box-shadow:0 0 0 3px #EA580C,0 10px 30px rgba(234,88,12,.55);background:#120F0D`
    const im = document.createElement('img')
    im.src = img
    im.alt = ''
    im.style.cssText = 'width:100%;height:100%;object-fit:cover'
    chip.appendChild(im)
    document.body.appendChild(chip)
    const dx = to.left + to.width / 2 - (from.left + from.width / 2)
    const dy = to.top + to.height / 2 - (from.top + from.height / 2)
    gsap
      .timeline({ onComplete: () => (chip.remove(), pop()) })
      .from(chip, { scale: 0, duration: 0.25, ease: 'back.out(3)' })
      .to(chip, { x: dx, duration: 0.75, ease: 'power2.in' }, 0.15)
      .to(chip, { y: dy, duration: 0.75, ease: dy < 0 ? 'back.in(1.6)' : 'power2.in' }, 0.15)
      .to(chip, { scale: 0.3, opacity: 0.6, duration: 0.75, ease: 'power2.in' }, 0.15)
  }

  const onAdd = (e) => {
    add(product.id)
    fly(e.currentTarget)
  }

  const tagList = tags.length > 0 && (
    <>
      {tags.map((t) => (
        <span key={t} className={`rounded-full px-3 py-1 text-xs font-bold ${TAG_STYLE[t] || 'bg-cream text-carbon'}`}>
          {config.tag_labels?.[t] || TAGS.find((x) => x.id === t)?.label || t}
        </span>
      ))}
    </>
  )

  const unavailableLabel = soldOut ? soldLabel : blocked ? soldLabel : null

  const action =
    qty > 0 && canAdd ? (
      <div
        ref={stepper}
        className={`flex items-center gap-1 rounded-full bg-carbon p-1 text-cream ${compact ? 'min-h-10' : 'min-h-11'}`}
        role="group"
        aria-label={`Cantidad de ${product.name}`}
      >
        <button
          type="button"
          onClick={() => setQty(product.id, qty - 1)}
          className={`grid place-items-center rounded-full transition-colors hover:bg-cream/15 active:scale-90 ${compact ? 'size-8' : 'size-9'}`}
          aria-label={qty === 1 ? `Quitar ${product.name} del pedido` : `Quitar uno de ${product.name}`}
        >
          <IconMinus width="16" height="16" />
        </button>
        <span className="tnum grid w-7 place-items-center overflow-hidden font-semibold" aria-live="polite">
          <span data-qty>{qty}</span>
        </span>
        <button
          ref={btn}
          type="button"
          onClick={onAdd}
          disabled={qty >= 20}
          className={`grid place-items-center rounded-full bg-ember text-carbon transition-colors hover:bg-gold active:scale-90 disabled:opacity-40 ${compact ? 'size-8' : 'size-9'}`}
          aria-label={`Agregar otro ${product.name}`}
        >
          <IconPlus width="16" height="16" />
        </button>
      </div>
    ) : (
      <button
        ref={btn}
        type="button"
        onClick={onAdd}
        disabled={!canAdd}
        className={`btn btn-dark disabled:cursor-not-allowed disabled:bg-carbon/10 disabled:text-ink-soft ${compact ? 'min-h-10 px-4 text-sm' : 'min-h-11 px-5'}`}
        aria-label={unavailableLabel ? `${product.name}: ${unavailableLabel.toLowerCase()}` : `Agregar ${product.name} al pedido`}
      >
        {unavailableLabel || (
          <>
            <IconPlus width="18" height="18" /> {ms.add_label || 'Agregar'}
          </>
        )}
      </button>
    )

  const shell = `group relative overflow-hidden rounded-2xl bg-white shadow-[0_1px_0_rgb(18_15_13/0.06),0_18px_40px_-28px_rgb(18_15_13/0.45)] ${
    hidden ? 'hidden' : ''
  }`

  if (compact) {
    return (
      <article ref={card} data-card data-flip-id={product.id} className={`${shell} flex gap-4 p-3 pr-4`}>
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-carbon sm:size-28">
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            decoding="async"
            width="224"
            height="224"
            className={`size-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.08] ${
              soldOut ? 'opacity-45 grayscale' : ''
            }`}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col py-1">
          {tagList && <div className="mb-1.5 flex flex-wrap gap-1.5">{tagList}</div>}
          <h3 className="font-display text-[1.45rem] leading-[0.95] font-extrabold text-carbon">{product.name}</h3>
          {product.description && <p className="mt-1 line-clamp-2 text-sm leading-snug text-ink-soft">{product.description}</p>}
          <div className="mt-auto flex items-center justify-between gap-3 pt-3">
            <p className="tnum font-display text-2xl font-black text-carbon">{formatCLP(product.price)}</p>
            {action}
          </div>
        </div>
      </article>
    )
  }

  return (
    <article
      ref={card}
      data-card
      data-flip-id={product.id}
      className={`${shell} flex will-change-transform flex-col ${feature ? 'sm:col-span-2 lg:row-span-2' : ''}`}
    >
      {/* Brillo que sigue al cursor */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'radial-gradient(420px circle at var(--mx,50%) var(--my,50%), rgb(255 255 255 / 0.16), transparent 45%)' }}
      />
      <div className={`relative overflow-hidden bg-carbon ${feature ? 'aspect-[4/3] sm:aspect-[16/9] lg:aspect-auto lg:flex-1' : 'aspect-[4/3]'}`}>
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          decoding="async"
          width="800"
          height="600"
          className={`size-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.07] ${
            feature ? 'lg:absolute lg:inset-0' : ''
          } ${soldOut ? 'opacity-45 grayscale' : ''}`}
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {soldOut && <span className="rounded-full bg-carbon px-3 py-1 text-xs font-bold text-cream">{soldLabel}</span>}
          {tagList}
        </div>
      </div>

      <div className={`flex flex-col p-5 sm:p-6 ${feature ? 'lg:p-8' : 'flex-1'}`}>
        <div className={feature ? 'lg:flex lg:items-end lg:justify-between lg:gap-8' : 'flex flex-1 flex-col'}>
          <div className={feature ? 'lg:max-w-xl' : 'flex flex-1 flex-col'}>
            <h3
              className={`font-display leading-[0.95] font-extrabold text-carbon ${
                feature ? 'text-[clamp(2.2rem,4vw,3.4rem)] font-black uppercase' : 'text-[1.85rem]'
              }`}
            >
              {product.name}
            </h3>

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

            <p className={`mt-3 leading-relaxed text-ink-soft ${feature ? 'text-base sm:text-lg' : 'flex-1 text-[15px]'}`}>{product.description}</p>
          </div>

          <div className={`relative mt-5 flex items-center justify-between gap-3 ${feature ? 'lg:mt-0 lg:shrink-0 lg:flex-col lg:items-end' : ''}`}>
            <p className={`tnum font-display font-black text-carbon ${feature ? 'text-4xl lg:text-5xl' : 'text-3xl'}`}>{formatCLP(product.price)}</p>
            {action}
          </div>
        </div>
      </div>
    </article>
  )
}
