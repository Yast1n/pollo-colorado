import { useEffect, useMemo, useRef, useState } from 'react'
import { useCart } from '../context/CartContext'
import { useStore } from '../context/StoreContext'
import { gsap, MQ } from '../lib/gsap'
import { assetUrl, formatCLP } from '../utils/format'
import { timeSlots } from '../utils/hours'
import { buildOrderMessage, whatsappLink } from '../utils/whatsapp'
import { statusInfo, useStoreStatus } from './StatusBadge'
import AnimatedPrice from './AnimatedPrice'
import { IconCheck, IconClose, IconMinus, IconPlus, IconWhatsApp, IconBag } from './Icons'

const FORM_KEY = 'pc:order-form:v1'

export default function CartDrawer() {
  const { items, total, setQty, clear, open, setOpen } = useCart()
  const { config } = useStore()
  const panel = useRef(null)
  const overlay = useRef(null)
  const closeBtn = useRef(null)
  const lastFocus = useRef(null)
  const [mounted, setMounted] = useState(open)
  const [form, setForm] = useState(() => {
    try {
      return { mode: 'pickup', time: 'asap', address: '', name: '', notes: '', ...JSON.parse(localStorage.getItem(FORM_KEY) || '{}') }
    } catch {
      return { mode: 'pickup', time: 'asap', address: '', name: '', notes: '' }
    }
  })
  const [touched, setTouched] = useState(false)
  const [sent, setSent] = useState(false) // pedido enviado a WhatsApp: mostramos el cierre
  const [undo, setUndo] = useState(null) // copia del pedido recién vaciado (para "Deshacer")
  const sentView = useRef(null)
  const effStatus = useStoreStatus()

  const slots = useMemo(() => timeSlots(config.hours), [config.hours, open]) // eslint-disable-line react-hooks/exhaustive-deps
  const available = items.filter((i) => i.available)
  const soldOutItems = items.filter((i) => !i.available)
  const availTotal = available.reduce((s, i) => s + i.qty * i.price, 0)
  const status = statusInfo(effStatus, config)
  const ct = config.cart || {}
  const QUICK_NOTES = (ct.quick_notes || []).filter((n) => n?.trim())
  const addressMissing = form.mode === 'delivery' && !form.address.trim()

  useEffect(() => {
    try {
      // No guardamos las observaciones: cambian en cada pedido.
      const { mode, address, name } = form
      localStorage.setItem(FORM_KEY, JSON.stringify({ mode, address, name }))
    } catch {
      /* ignorar */
    }
  }, [form])

  // La hora elegida puede quedar fuera de las franjas si pasa el tiempo.
  useEffect(() => {
    if (form.time !== 'asap' && !slots.slots.includes(form.time)) setForm((f) => ({ ...f, time: 'asap' }))
  }, [slots, form.time])

  // Abrir / cerrar con animación (panel desde la derecha; en móvil desde abajo).
  useEffect(() => {
    const reduce = window.matchMedia(MQ.reduce).matches
    const desktop = window.matchMedia(MQ.desktop).matches
    const from = desktop ? { xPercent: 100 } : { yPercent: 100 }
    if (open) {
      setSent(false)
      lastFocus.current = document.activeElement
      setMounted(true)
      document.documentElement.style.overflow = 'hidden'
      requestAnimationFrame(() => {
        if (!panel.current) return
        if (!reduce) {
          gsap.fromTo(overlay.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.out' })
          gsap.fromTo(panel.current, from, { xPercent: 0, yPercent: 0, duration: 0.55, ease: 'expo.out' })
          gsap.from(panel.current.querySelectorAll('[data-line]'), { x: 24, opacity: 0, stagger: 0.04, duration: 0.5, delay: 0.12 })
        }
        closeBtn.current?.focus()
      })
    } else if (mounted) {
      document.documentElement.style.overflow = ''
      const done = () => {
        setMounted(false)
        lastFocus.current?.focus?.()
      }
      if (reduce || !panel.current) return done()
      gsap.to(overlay.current, { opacity: 0, duration: 0.25 })
      gsap.to(panel.current, { ...from, duration: 0.35, ease: 'power3.in', onComplete: done })
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key === 'Tab' && panel.current) {
        // Trampa de foco simple dentro del diálogo.
        const f = panel.current.querySelectorAll('button:not([disabled]), a[href], input, select, textarea')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const toggleNote = (n) =>
    setForm((f) => {
      const parts = f.notes.split(',').map((s) => s.trim()).filter(Boolean)
      const has = parts.some((p) => p.toLowerCase() === n.toLowerCase())
      const next = has ? parts.filter((p) => p.toLowerCase() !== n.toLowerCase()) : [...parts, n]
      return { ...f, notes: next.join(', ') }
    })

  const message = buildOrderMessage({
    config,
    items: available,
    mode: form.mode,
    time: form.time,
    timeDayLabel: slots.label,
    address: form.address,
    name: form.name,
    notes: form.notes,
  })
  const href = whatsappLink(config.whatsapp, message)

  const onSend = (e) => {
    if (addressMissing || !available.length) {
      e.preventDefault()
      setTouched(true)
      return
    }
    // WhatsApp se abre en otra pestaña/app; aquí mostramos qué falta para cerrar el pedido.
    setTimeout(() => setSent(true), 250)
  }

  const onClear = () => {
    setUndo(items.map((i) => [i.id, i.qty]))
    clear()
  }
  const onUndo = () => {
    undo?.forEach(([id, q]) => setQty(id, q))
    setUndo(null)
  }
  const newOrder = () => {
    clear()
    setUndo(null)
    setSent(false)
    setForm((f) => ({ ...f, notes: '', time: 'asap' }))
  }

  // El aviso de "Deshacer" dura unos segundos; al agregar algo nuevo deja de tener sentido.
  useEffect(() => {
    if (!undo) return
    if (items.length) return setUndo(null)
    const t = setTimeout(() => setUndo(null), 8000)
    return () => clearTimeout(t)
  }, [undo, items.length])

  // Entrada del cierre: el check se "dibuja" y el texto sube.
  useEffect(() => {
    if (!sent || !sentView.current || window.matchMedia(MQ.reduce).matches) return
    const el = sentView.current
    const path = el.querySelector('path')
    const len = path?.getTotalLength?.() || 24
    gsap
      .timeline()
      .fromTo('[data-sent-ring]', { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2)' })
      .fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out' }, 0.2)
      .from(el.querySelectorAll('[data-sent-line]'), { y: 16, opacity: 0, stagger: 0.07, duration: 0.6 }, 0.25)
  }, [sent])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-[60]">
      <div ref={overlay} className="absolute inset-0 bg-carbon/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-[2rem] bg-cream text-carbon shadow-2xl md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[30rem] md:rounded-t-none md:rounded-l-[2rem]"
      >
        <div className="flex items-center justify-between border-b border-carbon/10 px-6 py-5">
          <h2 id="cart-title" className="display text-4xl">{ct.title}</h2>
          <button
            ref={closeBtn}
            type="button"
            onClick={() => setOpen(false)}
            className="grid size-11 place-items-center rounded-full bg-carbon/5 transition-colors hover:bg-carbon/10 active:scale-95"
            aria-label="Cerrar pedido"
          >
            <IconClose />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          {items.length === 0 ? (
            <div className="grid place-items-center py-16 text-center">
              <IconBag width="40" height="40" className="text-ember" />
              <p className="mt-4 text-xl font-semibold">{ct.empty_title}</p>
              <p className="mt-1 text-ink-soft">{ct.empty_text}</p>
              <a href="#menu" onClick={() => setOpen(false)} className="btn btn-dark mt-6">
                {config.hero_cta_menu || 'Ver la carta'}
              </a>
              {undo && (
                <p role="status" className="mt-6 flex items-center gap-3 rounded-full bg-carbon px-4 py-2 text-sm text-cream">
                  Vaciaste el pedido.
                  <button type="button" onClick={onUndo} className="font-semibold text-gold underline underline-offset-4">
                    Deshacer
                  </button>
                </p>
              )}
            </div>
          ) : sent ? (
            <div ref={sentView} className="flex flex-col items-center py-10 text-center" role="status">
              <span data-sent-ring className="grid size-20 place-items-center rounded-full bg-[#25D366] text-carbon shadow-[0_14px_30px_-12px_rgb(37_211_102/0.8)]">
                <IconCheck width="40" height="40" strokeWidth="2.5" />
              </span>
              <p data-sent-line className="display mt-6 text-4xl">Pedido listo en WhatsApp</p>
              <p data-sent-line className="mt-3 max-w-xs text-ink-soft">
                Falta un paso: toca <strong className="text-carbon">Enviar</strong> en WhatsApp. Te confirmamos disponibilidad
                {form.mode === 'delivery' ? ' y el costo del envío' : ''} por ahí mismo.
              </p>
              <div data-sent-line className="mt-8 grid w-full gap-2.5">
                <a href={href} target="_blank" rel="noopener noreferrer" className="btn w-full bg-[#25D366] text-carbon hover:bg-[#1ebe5a]">
                  <IconWhatsApp /> Abrir WhatsApp otra vez
                </a>
                <button type="button" onClick={() => setSent(false)} className="btn w-full border border-carbon/20 hover:border-carbon/50">
                  Volver a mi pedido
                </button>
                <button type="button" onClick={newOrder} className="mt-1 py-2 text-sm text-ink-soft underline-offset-4 hover:text-carbon hover:underline">
                  Empezar un pedido nuevo
                </button>
              </div>
            </div>
          ) : (
            <>
              {effStatus !== 'open' && (
                <p className="mb-5 rounded-2xl bg-gold/20 p-4 text-[15px]">
                  <strong>{status.label}.</strong>{' '}
                  {effStatus === 'scheduling'
                    ? 'Elige una hora y te confirmamos por WhatsApp.'
                    : 'Igual puedes enviarnos tu consulta y te respondemos apenas podamos.'}
                </p>
              )}

              <ul className="divide-y divide-carbon/10">
                {items.map((i) => (
                  <li key={i.id} data-line className="flex gap-4 py-4">
                    <img src={assetUrl(i.image_url)} alt="" className="size-16 shrink-0 rounded-xl bg-carbon object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug">{i.name}</p>
                      {i.available ? (
                        <p className="tnum text-sm text-ink-soft">{formatCLP(i.price)} c/u</p>
                      ) : (
                        <p className="text-sm font-semibold text-ember-deep">Se agotó: no se incluirá</p>
                      )}
                      <div className="mt-2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setQty(i.id, i.qty - 1)}
                          className="grid size-9 place-items-center rounded-full border border-carbon/15 active:scale-90"
                          aria-label={`Quitar uno de ${i.name}`}
                        >
                          <IconMinus width="16" height="16" />
                        </button>
                        <span className="tnum w-8 text-center font-semibold" aria-live="polite">{i.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(i.id, i.qty + 1)}
                          disabled={!i.available}
                          className="grid size-9 place-items-center rounded-full border border-carbon/15 active:scale-90 disabled:opacity-40"
                          aria-label={`Agregar uno de ${i.name}`}
                        >
                          <IconPlus width="16" height="16" />
                        </button>
                      </div>
                    </div>
                    <p className={`tnum shrink-0 font-semibold ${i.available ? '' : 'text-ink-soft line-through'}`}>
                      {formatCLP(i.price * i.qty)}
                    </p>
                  </li>
                ))}
              </ul>

              <fieldset className="mt-6">
                <legend className="label">¿Cómo lo quieres?</legend>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['pickup', 'Retiro en local'],
                    ['delivery', 'Delivery en Pirque'],
                  ].map(([v, l]) => (
                    <label
                      key={v}
                      className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border-2 px-3 text-center text-[15px] font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${
                        form.mode === v ? 'border-carbon bg-carbon text-cream' : 'border-carbon/15 bg-white'
                      }`}
                    >
                      <input type="radio" name="mode" value={v} checked={form.mode === v} onChange={set('mode')} className="sr-only" />
                      {l}
                    </label>
                  ))}
                </div>
                {form.mode === 'delivery' && <p className="mt-2 text-sm text-ink-soft">{config.delivery_note}</p>}
              </fieldset>

              {form.mode === 'delivery' && (
                <div className="mt-4">
                  <label htmlFor="o-address" className="label">Dirección de entrega</label>
                  <input
                    id="o-address"
                    className="field"
                    autoComplete="street-address"
                    placeholder="Calle, número y referencia"
                    value={form.address}
                    onChange={set('address')}
                    aria-invalid={touched && addressMissing}
                    aria-describedby={touched && addressMissing ? 'o-address-err' : undefined}
                  />
                  {touched && addressMissing && (
                    <p id="o-address-err" className="mt-1.5 text-sm font-semibold text-ember-deep">
                      Escribe la dirección para el delivery.
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="o-time" className="label">
                    Hora de {form.mode === 'delivery' ? 'entrega' : 'retiro'}
                  </label>
                  <select id="o-time" className="field" value={form.time} onChange={set('time')}>
                    <option value="asap">Lo antes posible</option>
                    {slots.slots.length > 0 && (
                      <optgroup label={slots.label}>
                        {slots.slots.map((s) => (
                          <option key={s} value={s}>{s} hrs</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
                <div>
                  <label htmlFor="o-name" className="label">Tu nombre</label>
                  <input id="o-name" className="field" autoComplete="given-name" placeholder="Opcional" value={form.name} onChange={set('name')} />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="o-notes" className="label">Observaciones</label>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {QUICK_NOTES.map((n) => {
                    const on = form.notes.toLowerCase().includes(n.toLowerCase())
                    return (
                      <button
                        key={n}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleNote(n)}
                        className={`min-h-9 rounded-full border px-3 text-sm font-medium transition-colors active:scale-95 ${
                          on ? 'border-ember bg-ember text-carbon' : 'border-carbon/15 bg-white'
                        }`}
                      >
                        {n}
                      </button>
                    )
                  })}
                </div>
                <textarea
                  id="o-notes"
                  rows="2"
                  className="field resize-none"
                  placeholder="Ej.: sin ají, bien dorado"
                  value={form.notes}
                  onChange={set('notes')}
                  maxLength={300}
                />
              </div>
            </>
          )}
        </div>

        {items.length > 0 && !sent && (
          <div className="border-t border-carbon/10 px-6 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="flex items-baseline justify-between">
              <span className="text-ink-soft">Total estimado</span>
              <AnimatedPrice value={availTotal} className="font-display text-4xl font-black" />
            </div>
            {form.mode === 'delivery' && <p className="text-right text-sm text-ink-soft">+ envío a confirmar</p>}
            {soldOutItems.length > 0 && (
              <p className="mt-1 text-sm text-ember-deep">{soldOutItems.length} producto(s) agotado(s) no se incluyen.</p>
            )}
            {touched && !available.length && (
              <p className="mt-1 text-sm font-semibold text-ember-deep" role="alert">Agrega al menos un producto disponible.</p>
            )}
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onSend}
              aria-disabled={addressMissing || !available.length}
              className="btn mt-4 w-full bg-[#25D366] text-base text-carbon hover:bg-[#1ebe5a]"
            >
              <IconWhatsApp /> {ct.send_label || 'Pedir por WhatsApp'}
            </a>
            <p className="mt-2 text-center text-xs text-ink-soft">Se abre WhatsApp con tu pedido ya escrito. Nada se cobra aquí.</p>
            <button type="button" onClick={onClear} className="mt-2 w-full py-2 text-sm text-ink-soft underline-offset-4 hover:underline">
              Vaciar pedido
            </button>
            <span className="sr-only">Total sin contar envío: {formatCLP(total)}</span>
          </div>
        )}
      </aside>
    </div>
  )
}
