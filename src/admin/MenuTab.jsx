import { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { CATEGORIES } from '../data/seed'
import * as store from '../services/storeService'
import { assetUrl, formatCLP } from '../utils/format'
import { IconEdit, IconPlus, IconTrash } from '../components/Icons'
import ProductForm from './ProductForm'
import { Card, Switch } from './ui'
import { useToast } from './Toast'

export default function MenuTab() {
  const { products, reload } = useStore()
  const toast = useToast()
  const [editing, setEditing] = useState(null) // producto | {} (nuevo) | null
  const [pending, setPending] = useState({}) // id -> available optimista

  const toggle = async (p, available) => {
    setPending((x) => ({ ...x, [p.id]: available }))
    try {
      await store.setAvailability(p.id, available)
      toast(`${p.name}: ${available ? 'en stock' : 'agotado'}`)
      await reload()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setPending((x) => {
        const n = { ...x }
        delete n[p.id]
        return n
      })
    }
  }

  const remove = async (p) => {
    if (!window.confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return false
    try {
      await store.deleteProduct(p.id)
      toast('Producto eliminado')
      reload()
      return true
    } catch (e) {
      toast(e.message, 'error')
      return false
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="display text-5xl">Menú</h2>
          <p className="mt-1 text-sm text-ash">Toca un producto para editarlo. El interruptor lo marca agotado sin borrarlo.</p>
        </div>
        <button type="button" onClick={() => setEditing({})} className="btn btn-ember w-full sm:w-auto">
          <IconPlus /> Nuevo producto
        </button>
      </div>

      {CATEGORIES.map((c) => {
        const list = products.filter((p) => p.category === c.id)
        return (
          <Card key={c.id} title={c.label}>
            {list.length === 0 ? (
              <p className="text-sm text-ash">Sin productos en esta categoría.</p>
            ) : (
              <ul className="divide-y divide-cream/10">
                {list.map((p) => {
                  const available = pending[p.id] ?? p.available
                  return (
                    <li key={p.id} className="flex items-center gap-3 py-2.5 sm:gap-4">
                      {/* Toda la fila (foto + nombre) abre la edición: blanco grande para el pulgar */}
                      <button
                        type="button"
                        onClick={() => setEditing(p)}
                        className="-mx-2 flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-2 py-1.5 text-left transition-colors hover:bg-cream/5 active:bg-cream/10 sm:gap-4"
                        aria-label={`Editar ${p.name}`}
                      >
                        <img src={assetUrl(p.image_url)} alt="" className="size-14 shrink-0 rounded-xl bg-carbon object-cover sm:size-16" />
                        <span className="min-w-0 flex-1">
                          <span className={`line-clamp-2 leading-snug font-semibold ${available ? '' : 'text-ash line-through'}`}>{p.name}</span>
                          <span className="tnum mt-0.5 flex items-center gap-1.5 text-sm text-ash">
                            {formatCLP(p.price)}
                            <IconEdit width="14" height="14" className="opacity-60" />
                          </span>
                        </span>
                      </button>
                      <label className="flex shrink-0 flex-col items-center gap-1 text-[11px] text-ash sm:flex-row sm:gap-2 sm:text-xs">
                        <Switch checked={available} onChange={(v) => toggle(p, v)} label={`${p.name} en stock`} disabled={p.id in pending} />
                        <span className="w-14 text-center sm:text-left">{available ? 'En stock' : 'Agotado'}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => remove(p)}
                        className="hidden size-10 shrink-0 place-items-center rounded-full text-ash hover:bg-red-500/15 hover:text-red-300 sm:grid"
                        aria-label={`Eliminar ${p.name}`}
                      >
                        <IconTrash width="18" height="18" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        )
      })}

      {!store.isRemote && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm('¿Restaurar el menú y la configuración de ejemplo?')) {
              store.resetDemoData()
              toast('Datos de ejemplo restaurados')
            }
          }}
          className="text-sm text-ash underline underline-offset-4 hover:text-cream"
        >
          Restaurar datos de ejemplo
        </button>
      )}

      {editing && (
        <ProductForm
          product={editing}
          onClose={() => setEditing(null)}
          onDelete={editing.id ? () => remove(editing).then((ok) => ok && setEditing(null)) : undefined}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
    </>
  )
}
