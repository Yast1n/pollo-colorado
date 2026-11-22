import { useRef } from 'react'
import { useCart } from '../context/CartContext'
import { TAGS } from '../data/seed'
import { gsap } from '../lib/gsap'
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
  const btn = useRef(null)
  const soldOut = !product.available
  const tags = soldOut ? [] : product.tags

  const onAdd = () => {
    add(product.id)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Microinteracción: el botón "late" y sale un +1 que flota.
    const b = btn.current
    gsap.fromTo(b, { scale: 0.9 }, { scale: 1, duration: 0.45, ease: 'back.out(4)' })
    const plus = document.createElement('span')
    plus.textContent = '+1'
    plus.setAttribute('aria-hidden', 'true')
    plus.className = 'pointer-events-none absolute -top-2 right-3 font-display text-2xl font-black text-ember'
    b.parentElement.appendChild(plus)
    gsap.fromTo(
      plus,
      { y: 0, opacity: 1 },
      { y: -42, opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: () => plus.remove() },
    )
  }

  return (
    <article
      data-card
      data-flip-id={product.id}
      className={`group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_1px_0_rgb(18_15_13/0.06),0_18px_40px_-28px_rgb(18_15_13/0.45)] ${
        hidden ? 'hidden' : ''
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-carbon">
        <img
          src={assetUrl(product.image_url) || assetUrl('images/productos/pollo-entero.svg')}
          alt={product.name}
          loading="lazy"
          decoding="async"
          width="800"
          height="600"
          className={`size-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04] ${
            soldOut ? 'opacity-45 grayscale' : ''
          }`}
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {soldOut && (
            <span className="rounded-full bg-carbon px-3 py-1 text-xs font-bold text-cream">Agotado</span>
          )}
          {tags.map((t) => (
            <span key={t} className={`rounded-full px-3 py-1 text-xs font-bold ${TAG_STYLE[t] || 'bg-cream text-carbon'}`}>
              {TAGS.find((x) => x.id === t)?.label || t}
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
              'Agotado'
            ) : (
              <>
                <IconPlus width="18" height="18" /> Agregar
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}
