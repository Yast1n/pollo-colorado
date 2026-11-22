import { useEffect, useState } from 'react'
import { useStore } from '../context/StoreContext'
import { STATUSES } from '../data/seed'
import * as store from '../services/storeService'
import { Card, Switch } from './ui'
import { useToast } from './Toast'
import { useStoreStatus } from '../components/StatusBadge'
import { chileDateKey, chileNow, dayPhrase, openState, scheduleDriven } from '../utils/hours'

const STATUS_STYLE = {
  open: 'data-[on=true]:border-emerald-400 data-[on=true]:bg-emerald-400/15',
  scheduling: 'data-[on=true]:border-gold data-[on=true]:bg-gold/15',
  soldout: 'data-[on=true]:border-ember data-[on=true]:bg-ember/20',
  closed: 'data-[on=true]:border-cream/60 data-[on=true]:bg-cream/10',
}
const DOT = { open: 'bg-emerald-400', scheduling: 'bg-gold', soldout: 'bg-ember', closed: 'bg-ash' }

export default function OperationsTab() {
  const { config, products, reload } = useStore()
  const toast = useToast()
  const [status, setStatus] = useState(config.status)
  const [text, setText] = useState(config.announcement)
  const [enabled, setEnabled] = useState(config.announcement_enabled)
  const [saving, setSaving] = useState(false)

  const [busy, setBusy] = useState(false)
  const auto = Boolean(config.status_auto)
  const live = useStoreStatus() // lo que ve el cliente ahora mismo
  const bySchedule = scheduleDriven(config)
  const os = openState(config.hours, chileNow())
  const labelOf = (id) => config.status_texts?.[id]?.label || STATUSES.find((s) => s.id === id)?.label

  useEffect(() => setStatus(config.status), [config.status])

  const save = async (patch, msg, rollback) => {
    setBusy(true)
    try {
      await store.updateConfig(patch)
      toast(msg)
      await reload()
    } catch (e) {
      rollback?.()
      toast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  // En automático, elegir un estado lo fija solo por hoy; mañana vuelve a mandar el horario.
  const changeStatus = (id) => {
    const prev = status
    setStatus(id) // optimista: 1 toque
    save(
      auto ? { status: id, status_date: chileDateKey() } : { status: id },
      auto ? `Por hoy: ${labelOf(id)}` : `Estado: ${labelOf(id)}`,
      () => setStatus(prev),
    )
  }
  const setAuto = (v) =>
    save({ status_auto: v, status_date: '' }, v ? 'El horario controla el estado' : 'Estado manual: lo cambias tú')
  const backToSchedule = () => save({ status_date: '' }, 'De vuelta al horario')

  const selected = auto ? live : status
  const scheduleLine = os.open ? `Según el horario: abierto hasta las ${os.closes}` : os.opens ? `Según el horario: cerrado, abre ${dayPhrase(os.day)} a las ${os.opens}` : 'Sin horario de apertura configurado'

  const saveBanner = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await store.updateConfig({ announcement: text.trim(), announcement_enabled: enabled })
      toast('Aviso actualizado')
      reload()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const soldOut = products.filter((p) => !p.available).length

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Estado del local" description="Es lo que ven tus clientes en el sitio.">
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-carbon p-4">
          <span>
            <span className="block font-semibold">Automático según horario</span>
            <span className="mt-0.5 block text-sm text-ash">Abre y cierra solo con los horarios de “Mi negocio”.</span>
          </span>
          <Switch checked={auto} onChange={setAuto} label="Estado automático según horario" disabled={busy} />
        </div>

        <p className="mt-4 flex items-start gap-2.5 text-sm" role="status">
          <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${DOT[live]}`} />
          <span>
            Ahora el sitio muestra <strong>{labelOf(live)}</strong>
            {auto && <span className="block text-ash">{bySchedule ? scheduleLine : 'Cambio manual de hoy. Mañana vuelve al horario.'}</span>}
          </span>
        </p>
        {auto && !bySchedule && (
          <button type="button" onClick={backToSchedule} disabled={busy} className="btn btn-ghost mt-3 min-h-11 w-full text-sm">
            Volver al horario ahora
          </button>
        )}

        <p className="mt-6 mb-3 text-sm font-semibold text-ash">{auto ? 'Cambiar solo por hoy' : 'Elige el estado'}</p>
        <div className="grid grid-cols-2 gap-3">
          {STATUSES.map((s) => (
            <button
              key={s.id}
              type="button"
              data-on={selected === s.id}
              aria-pressed={selected === s.id}
              disabled={busy}
              onClick={() => changeStatus(s.id)}
              className={`flex min-h-20 flex-col items-start justify-center gap-1 rounded-2xl border-2 border-cream/10 p-4 text-left transition-colors active:scale-[0.98] disabled:opacity-70 ${STATUS_STYLE[s.id]}`}
            >
              <span className="flex items-center gap-2 font-semibold">
                <span className={`size-2.5 shrink-0 rounded-full ${DOT[s.id]}`} /> {labelOf(s.id)}
              </span>
              <span className="text-xs text-ash">{config.status_texts?.[s.id]?.hint ?? s.hint}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Aviso superior" description="La franja naranja sobre el menú del sitio.">
        <form onSubmit={saveBanner} className="space-y-4">
          <label htmlFor="banner" className="sr-only">Texto del aviso</label>
          <textarea
            id="banner"
            rows="3"
            maxLength={140}
            className="field-dark resize-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="¡Nueva tanda saliendo de las brasas a las 13:30 hrs!"
          />
          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-3 text-sm">
              <Switch checked={enabled} onChange={setEnabled} label="Mostrar aviso" />
              Mostrar en el sitio
            </label>
            <span className="tnum text-xs text-ash">{text.length}/140</span>
          </div>
          <button type="submit" disabled={saving} className="btn btn-ember w-full sm:w-auto disabled:opacity-60">
            {saving ? 'Guardando…' : 'Guardar aviso'}
          </button>
        </form>
      </Card>

      <Card className="lg:col-span-2">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-ash">Productos en carta</dt>
            <dd className="tnum font-display text-5xl font-black">{products.length}</dd>
          </div>
          <div>
            <dt className="text-sm text-ash">Agotados ahora</dt>
            <dd className={`tnum font-display text-5xl font-black ${soldOut ? 'text-ember' : ''}`}>{soldOut}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-sm text-ash">Sincronización</dt>
            <dd className="mt-2 font-semibold">{store.isRemote ? 'Supabase en vivo' : 'Solo este navegador'}</dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}
