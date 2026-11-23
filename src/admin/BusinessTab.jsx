import { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { DAYS } from '../data/seed'
import * as store from '../services/storeService'
import { onlyDigits } from '../utils/format'
import { validPhone, whatsappLink } from '../utils/whatsapp'
import { Card, Switch } from './ui'
import { useToast } from './Toast'

const ORDER = [1, 2, 3, 4, 5, 6, 0]
const MAX_ALT = 3

export default function BusinessTab() {
  const { config, reload } = useStore()
  const toast = useToast()
  const [c, setC] = useState(() => structuredClone(config))
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setC((x) => ({ ...x, [k]: e.target.value }))
  const setSocial = (k) => (e) => setC((x) => ({ ...x, socials: { ...x.socials, [k]: e.target.value } }))
  const setHour = (d, k, v) =>
    setC((x) => {
      const hours = x.hours.map((h, i) => (i === d ? { ...h, [k]: v } : h))
      return { ...x, hours }
    })

  const phone = onlyDigits(c.whatsapp)
  const phoneOk = validPhone(phone)
  const alts = Array.isArray(c.whatsapp_alt) ? c.whatsapp_alt : []
  const setAlt = (i, k, v) => setC((x) => ({ ...x, whatsapp_alt: alts.map((a, j) => (j === i ? { ...a, [k]: v } : a)) }))
  const addAlt = () => setC((x) => ({ ...x, whatsapp_alt: [...alts, { label: '', number: '' }] }))
  const removeAlt = (i) => setC((x) => ({ ...x, whatsapp_alt: alts.filter((_, j) => j !== i) }))

  const submit = async (e) => {
    e.preventDefault()
    if (!phoneOk) {
      toast('El WhatsApp debe incluir código de país, ej.: 56912345678', 'error')
      return
    }
    // Filas vacías se descartan; las que tienen algo deben ser un número válido.
    const whatsapp_alt = alts
      .map((a) => ({ label: (a.label || '').trim(), number: onlyDigits(a.number) }))
      .filter((a) => a.label || a.number)
    const bad = whatsapp_alt.findIndex((a) => !validPhone(a.number))
    if (bad >= 0) {
      toast(`El número adicional ${bad + 1} no es válido (ej.: 56912345678)`, 'error')
      return
    }
    if (whatsapp_alt.some((a) => a.number === phone)) {
      toast('Un número adicional es igual al principal', 'error')
      return
    }
    setSaving(true)
    try {
      // Solo los campos de esta pestaña (no pisa el estado ni los textos editados en otra).
      const { greeting, address, maps_query, delivery_note, hours, socials } = c
      await store.updateConfig({ whatsapp: phone, whatsapp_alt, greeting, address, maps_query, delivery_note, hours, socials })
      setC((x) => ({ ...x, whatsapp_alt }))
      toast('Datos del negocio guardados')
      reload()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const field = (id, label, k, props = {}) => (
    <div className={props.wide ? 'sm:col-span-2' : ''}>
      <label htmlFor={id} className="label">{label}</label>
      {props.area ? (
        <textarea id={id} rows="3" className="field-dark resize-none" value={c[k] || ''} onChange={set(k)} />
      ) : (
        <input id={id} className="field-dark" value={c[k] || ''} onChange={set(k)} placeholder={props.placeholder} inputMode={props.inputMode} />
      )}
      {props.hint && <p className="mt-1 text-xs text-ash">{props.hint}</p>}
    </div>
  )

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card title="WhatsApp" description="Número principal que recibe los pedidos, números de respaldo y saludo con el que empieza cada mensaje.">
        <div className="grid gap-4 sm:grid-cols-2">
          {field('b-wa', 'Número principal (con código de país)', 'whatsapp', {
            placeholder: '569XXXXXXXX',
            inputMode: 'tel',
            hint: phoneOk ? `Se abrirá: wa.me/${phone}` : 'Formato: 56 + 9 + 8 dígitos, sin + ni espacios.',
          })}
          <div className="flex items-end">
            <a href={whatsappLink(phone, 'Prueba desde el panel de Pollo Colorado')} target="_blank" rel="noopener noreferrer" className="btn btn-ghost w-full">
              Probar enlace
            </a>
          </div>
          {field('b-greet', 'Mensaje de saludo', 'greeting', { wide: true, area: true })}
        </div>

        <div className="mt-6 border-t border-cream/10 pt-5">
          <p className="font-semibold">Números de respaldo</p>
          <p className="mt-1 text-sm text-ash">
            Si el principal no responde, el cliente puede enviar el mismo pedido a estos números. Aparecen en "Visítanos" y al
            terminar un pedido.
          </p>
          <ul className="mt-4 space-y-3">
            {alts.map((a, i) => {
              const n = onlyDigits(a.number)
              return (
                <li key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-cream/10 p-3 sm:grid-cols-[1fr_1.3fr_auto_auto] sm:items-center sm:border-0 sm:p-0">
                  <input
                    aria-label={`Nombre del número adicional ${i + 1}`}
                    className="field-dark col-span-2 sm:col-span-1"
                    placeholder="Nombre (ej.: Caja, Juan)"
                    maxLength={30}
                    value={a.label || ''}
                    onChange={(e) => setAlt(i, 'label', e.target.value)}
                  />
                  <input
                    aria-label={`Número adicional ${i + 1}`}
                    className="field-dark tnum col-span-2 sm:col-span-1"
                    placeholder="569XXXXXXXX"
                    inputMode="tel"
                    value={a.number || ''}
                    onChange={(e) => setAlt(i, 'number', e.target.value)}
                    aria-invalid={!!n && !validPhone(n)}
                  />
                  <a
                    href={validPhone(n) ? whatsappLink(n, 'Prueba desde el panel de Pollo Colorado') : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={!validPhone(n)}
                    className={`btn btn-ghost ${validPhone(n) ? '' : 'pointer-events-none opacity-40'}`}
                  >
                    Probar
                  </a>
                  <button type="button" onClick={() => removeAlt(i)} className="btn btn-ghost text-red-300">
                    Quitar
                  </button>
                </li>
              )
            })}
          </ul>
          {alts.length < MAX_ALT && (
            <button type="button" onClick={addAlt} className="btn btn-ghost mt-3">
              + Agregar número
            </button>
          )}
        </div>
      </Card>

      <Card title="Ubicación y delivery">
        <div className="grid gap-4 sm:grid-cols-2">
          {field('b-addr', 'Dirección visible', 'address')}
          {field('b-maps', 'Búsqueda para Maps / Waze', 'maps_query', { hint: 'Lo que se busca al tocar "Abrir en Google Maps".' })}
          {field('b-deliv', 'Nota de delivery', 'delivery_note', { wide: true })}
        </div>
      </Card>

      <Card title="Horarios de atención">
        <ul className="divide-y divide-cream/10">
          {ORDER.map((d) => {
            const h = c.hours[d]
            return (
              <li key={d} className="flex flex-wrap items-center gap-3 py-3">
                <span className="w-24 font-semibold">{DAYS[d]}</span>
                <label className="flex items-center gap-2 text-sm text-ash">
                  <Switch checked={!h.closed} onChange={(v) => setHour(d, 'closed', !v)} label={`${DAYS[d]} abierto`} />
                  {h.closed ? 'Cerrado' : 'Abierto'}
                </label>
                {!h.closed && (
                  <span className="ml-auto flex items-center gap-2">
                    <input type="time" aria-label={`${DAYS[d]} abre`} className="field-dark tnum w-32 py-2" value={h.open} onChange={(e) => setHour(d, 'open', e.target.value)} />
                    <span className="text-ash">a</span>
                    <input type="time" aria-label={`${DAYS[d]} cierra`} className="field-dark tnum w-32 py-2" value={h.close} onChange={(e) => setHour(d, 'close', e.target.value)} />
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </Card>

      <Card title="Redes sociales" description="Deja vacío lo que no uses; no aparecerá en el sitio.">
        <div className="grid gap-4 sm:grid-cols-3">
          {['instagram', 'facebook', 'tiktok'].map((k) => (
            <div key={k}>
              <label htmlFor={`b-${k}`} className="label capitalize">{k}</label>
              <input id={`b-${k}`} type="url" className="field-dark" placeholder="https://…" value={c.socials?.[k] || ''} onChange={setSocial(k)} />
            </div>
          ))}
        </div>
      </Card>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mx-4 sm:bottom-0 border-t border-cream/10 bg-carbon/90 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <button type="submit" disabled={saving} className="btn btn-ember w-full sm:w-auto disabled:opacity-60">
          {saving ? 'Guardando…' : 'Guardar todos los cambios'}
        </button>
      </div>
    </form>
  )
}
