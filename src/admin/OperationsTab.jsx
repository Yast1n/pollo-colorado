import { useEffect, useState } from 'react'
import { useStore } from '../context/StoreContext'
import { STATUSES } from '../data/seed'
import * as store from '../services/storeService'
import { Card, Switch } from './ui'
import { useToast } from './Toast'

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

  useEffect(() => setStatus(config.status), [config.status])

  const changeStatus = async (id) => {
    const prev = status
    setStatus(id) // optimista: 1 clic
    try {
      await store.updateConfig({ status: id })
      toast(`Estado: ${config.status_texts?.[id]?.label || STATUSES.find((s) => s.id === id).label}`)
      reload()
    } catch (e) {
      setStatus(prev)
      toast(e.message, 'error')
    }
  }

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
      <Card title="Estado del local" description="Se muestra en vivo en el sitio. Un clic y listo.">
        <div className="grid grid-cols-2 gap-3">
          {STATUSES.map((s) => (
            <button
              key={s.id}
              type="button"
              data-on={status === s.id}
              aria-pressed={status === s.id}
              onClick={() => changeStatus(s.id)}
              className={`flex min-h-20 flex-col items-start justify-center gap-1 rounded-2xl border-2 border-cream/10 p-4 text-left transition-colors active:scale-[0.98] ${STATUS_STYLE[s.id]}`}
            >
              <span className="flex items-center gap-2 font-semibold">
                <span className={`size-2.5 rounded-full ${DOT[s.id]}`} /> {config.status_texts?.[s.id]?.label || s.label}
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
