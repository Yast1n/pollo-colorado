import { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { DAYS } from '../data/seed'
import * as store from '../services/storeService'
import { onlyDigits } from '../utils/format'
import { whatsappLink } from '../utils/whatsapp'
import { Card, Switch } from './ui'
import { useToast } from './Toast'

const ORDER = [1, 2, 3, 4, 5, 6, 0]

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
  const phoneOk = phone.length >= 10 && phone.length <= 15

  const submit = async (e) => {
    e.preventDefault()
    if (!phoneOk) {
      toast('El WhatsApp debe incluir código de país, ej.: 56912345678', 'error')
      return
    }
    setSaving(true)
    try {
      // Solo los campos de esta pestaña (no pisa el estado ni los textos editados en otra).
      const { greeting, address, maps_query, delivery_note, hours, socials } = c
      await store.updateConfig({ whatsapp: phone, greeting, address, maps_query, delivery_note, hours, socials })
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
      <Card title="WhatsApp" description="Número que recibe los pedidos y saludo con el que empieza cada mensaje.">
        <div className="grid gap-4 sm:grid-cols-2">
          {field('b-wa', 'Número (con código de país)', 'whatsapp', {
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
