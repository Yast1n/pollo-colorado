import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, TAGS } from '../data/seed'
import * as store from '../services/storeService'
import { assetUrl } from '../utils/format'
import { IconClose, IconImage } from '../components/Icons'
import { Switch } from './ui'
import { useToast } from './Toast'

const EMPTY = {
  name: '',
  description: '',
  category: 'pollos',
  price: '',
  weight_label: '',
  portions: '',
  image_url: '',
  tags: [],
  available: true,
  sort_order: 0,
}

export default function ProductForm({ product, onClose, onSaved }) {
  const toast = useToast()
  const [p, setP] = useState({ ...EMPTY, ...product })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const fileRef = useRef(null)
  const firstRef = useRef(null)
  const isNew = !product.id

  useEffect(() => {
    firstRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.documentElement.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
    }
  }, [onClose])

  const set = (k) => (e) => setP((x) => ({ ...x, [k]: e.target.value }))
  const toggleTag = (t) =>
    setP((x) => ({ ...x, tags: x.tags.includes(t) ? x.tags.filter((y) => y !== t) : [...x.tags, t] }))

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const url = await store.uploadImage(file)
      setP((x) => ({ ...x, image_url: url }))
      toast('Foto lista')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!p.name.trim()) errs.name = 'Escribe el nombre.'
    const price = Number(String(p.price).replace(/\D/g, ''))
    if (!price) errs.price = 'Escribe un precio mayor a 0.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    try {
      await store.saveProduct({ ...p, name: p.name.trim(), price, sort_order: Number(p.sort_order) || 0 })
      toast(isNew ? 'Producto creado' : 'Cambios guardados')
      onSaved()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-carbon/80 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pf-title"
        noValidate
        className="flex max-h-[94dvh] w-full max-w-2xl flex-col rounded-t-3xl border border-cream/10 bg-carbon-2 sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-cream/10 px-6 py-4">
          <h2 id="pf-title" className="font-display text-3xl font-extrabold">
            {isNew ? 'Nuevo producto' : 'Editar producto'}
          </h2>
          <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full hover:bg-cream/10" aria-label="Cerrar">
            <IconClose />
          </button>
        </div>

        <div className="grid flex-1 gap-5 overflow-y-auto px-6 py-5 sm:grid-cols-2">
          {/* Foto */}
          <div className="sm:col-span-2">
            <span className="label">Foto</span>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl bg-carbon sm:w-48">
                {p.image_url ? (
                  <img src={assetUrl(p.image_url)} alt="Vista previa" className="size-full object-cover" />
                ) : (
                  <div className="grid size-full place-items-center text-ash"><IconImage width="32" height="32" /></div>
                )}
                {uploading && <div className="absolute inset-0 grid place-items-center bg-carbon/70 text-sm">Comprimiendo y subiendo…</div>}
              </div>
              <div className="flex-1 space-y-3">
                <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="sr-only" id="pf-file" />
                <label htmlFor="pf-file" className="btn btn-ghost w-full cursor-pointer sm:w-auto">
                  <IconImage /> {p.image_url ? 'Cambiar foto' : 'Subir foto'}
                </label>
                <div>
                  <label htmlFor="pf-url" className="mb-1 block text-xs text-ash">o pega una URL de imagen</label>
                  <input id="pf-url" className="field-dark" placeholder="https://…" value={p.image_url.startsWith('data:') ? '' : p.image_url} onChange={set('image_url')} />
                </div>
              </div>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="pf-name" className="label">Nombre</label>
            <input ref={firstRef} id="pf-name" className="field-dark" value={p.name} onChange={set('name')} aria-invalid={!!errors.name} />
            {errors.name && <p className="mt-1 text-sm text-orange-300">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="pf-cat" className="label">Categoría</label>
            <select id="pf-cat" className="field-dark" value={p.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="pf-price" className="label">Precio (CLP)</label>
            <input id="pf-price" inputMode="numeric" className="field-dark tnum" placeholder="13990" value={p.price} onChange={set('price')} aria-invalid={!!errors.price} />
            {errors.price && <p className="mt-1 text-sm text-orange-300">{errors.price}</p>}
          </div>
          <div>
            <label htmlFor="pf-weight" className="label">Peso / tamaño</label>
            <input id="pf-weight" className="field-dark" placeholder="2.4 – 2.5 kg" value={p.weight_label} onChange={set('weight_label')} />
          </div>
          <div>
            <label htmlFor="pf-portions" className="label">Porciones</label>
            <input id="pf-portions" className="field-dark" placeholder="4 personas" value={p.portions} onChange={set('portions')} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="pf-desc" className="label">Descripción</label>
            <textarea id="pf-desc" rows="3" maxLength={220} className="field-dark resize-none" value={p.description} onChange={set('description')} />
          </div>

          <fieldset className="sm:col-span-2">
            <legend className="label">Etiquetas</legend>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => {
                const on = p.tags.includes(t.id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleTag(t.id)}
                    className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors ${on ? 'border-gold bg-gold text-carbon' : 'border-cream/20 text-ash'}`}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="pf-order" className="label">Orden en la carta</label>
            <input id="pf-order" type="number" className="field-dark tnum" value={p.sort_order} onChange={set('sort_order')} />
          </div>
          <div className="flex items-end">
            <label className="flex min-h-12 items-center gap-3">
              <Switch checked={p.available} onChange={(v) => setP((x) => ({ ...x, available: v }))} label="En stock" />
              {p.available ? 'En stock' : 'Agotado'}
            </label>
          </div>
        </div>

        <div className="flex gap-3 border-t border-cream/10 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1 sm:flex-none">Cancelar</button>
          <button type="submit" disabled={saving || uploading} className="btn btn-ember flex-1 disabled:opacity-60">
            {saving ? 'Guardando…' : isNew ? 'Crear producto' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
