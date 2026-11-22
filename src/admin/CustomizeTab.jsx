import { createContext, useContext, useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext'
import { CATEGORIES, SEED_CONFIG, STATUSES, TAGS } from '../data/seed'
import * as store from '../services/storeService'
import { assetUrl } from '../utils/format'
import { DefaultMark } from '../components/Header'
import { Stamp } from '../components/Hero'
import { IconImage, IconPlus, IconTrash } from '../components/Icons'
import { Switch } from './ui'
import { useToast } from './Toast'

// ---------- helpers de ruta: get(c, 'visit.title') / set(c, 'visit.title', v) ----------
const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj)
function setIn(obj, path, value) {
  const keys = path.split('.')
  const out = Array.isArray(obj) ? [...obj] : { ...obj }
  let cur = out
  keys.forEach((k, i) => {
    if (i === keys.length - 1) cur[k] = value
    else {
      cur[k] = Array.isArray(cur[k]) ? [...cur[k]] : { ...(cur[k] || {}) }
      cur = cur[k]
    }
  })
  return out
}

function Section({ title, description, children, defaultOpen = false }) {
  return (
    <details open={defaultOpen} className="group rounded-3xl border border-cream/10 bg-carbon-2 open:pb-2">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-display text-2xl font-extrabold sm:text-3xl">{title}</span>
          {description && <span className="mt-0.5 block text-sm text-ash">{description}</span>}
        </span>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cream/10 text-xl transition-transform group-open:rotate-45" aria-hidden="true">
          +
        </span>
      </summary>
      <div className="grid gap-4 px-5 pb-4 sm:grid-cols-2 sm:px-6">{children}</div>
    </details>
  )
}

const FormCtx = createContext(null)

// Campos que gestionan otras pestañas (Operación / Mi negocio): esta pestaña nunca los guarda,
// así no pisa un cambio de estado hecho desde otro dispositivo mientras editas textos.
const OTHER_TABS = ['status', 'announcement', 'announcement_enabled', 'whatsapp', 'greeting', 'address', 'maps_query', 'delivery_note', 'hours', 'socials']
const ownFields = (cfg) => Object.fromEntries(Object.entries(cfg).filter(([k]) => !OTHER_TABS.includes(k)))

function Text({ label, path, area, hint, wide, max, placeholder }) {
  const { val, set } = useContext(FormCtx)
    const id = `cz-${path.replace(/\W/g, '-')}`
    const Tag = area ? 'textarea' : 'input'
    return (
      <div className={wide || area ? 'sm:col-span-2' : ''}>
        <label htmlFor={id} className="label">{label}</label>
        <Tag
          id={id}
          rows={area ? 3 : undefined}
          maxLength={max}
          placeholder={placeholder}
          className={`field-dark ${area ? 'resize-y' : ''}`}
          value={val(path)}
          onChange={(e) => set(path, e.target.value)}
        />
        {hint && <p className="mt-1 text-xs text-ash">{hint}</p>}
      </div>
    )
  }

function Toggle({ label, path, wide }) {
  const { c, set } = useContext(FormCtx)
  return (
    <label className={`flex min-h-12 items-center gap-3 ${wide ? 'sm:col-span-2' : ''}`}>
      <Switch checked={get(c, path) !== false} onChange={(v) => set(path, v)} label={label} />
      <span className="text-sm">{label}</span>
    </label>
  )
}

function ImageField({ label, path, hint, contain, allowEmpty = true }) {
  const { val, set, upload, uploading } = useContext(FormCtx)
    const id = `cz-img-${path.replace(/\W/g, '-')}`
    const src = val(path)
    return (
      <div className="sm:col-span-2">
        <span className="label">{label}</span>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative grid aspect-[4/3] w-full shrink-0 place-items-center overflow-hidden rounded-2xl bg-carbon sm:w-40">
            {src ? (
              <img src={assetUrl(src)} alt="" className={`size-full ${contain ? 'object-contain p-3' : 'object-cover'}`} />
            ) : (
              <IconImage width="28" height="28" className="text-ash" />
            )}
            {uploading === path && <div className="absolute inset-0 grid place-items-center bg-carbon/70 text-xs">Subiendo…</div>}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap gap-2">
              <input id={id} type="file" accept="image/*" className="sr-only" onChange={(e) => { upload(path, e.target.files?.[0]); e.target.value = '' }} />
              <label htmlFor={id} className="btn btn-ghost min-h-10 cursor-pointer px-4 text-sm">
                <IconImage width="16" height="16" /> {src ? 'Cambiar' : 'Subir'}
              </label>
              {src && allowEmpty && (
                <button type="button" onClick={() => set(path, '')} className="btn min-h-10 px-4 text-sm text-ash hover:text-cream">
                  Quitar
                </button>
              )}
            </div>
            <input
              aria-label={`${label}: URL`}
              className="field-dark py-2 text-sm"
              placeholder="o pega una URL https://…"
              value={src.startsWith('data:') ? '' : src}
              onChange={(e) => set(path, e.target.value)}
            />
            {hint && <p className="text-xs text-ash">{hint}</p>}
          </div>
        </div>
      </div>
    )
  }


export default function CustomizeTab() {
  const { config, reload } = useStore()
  const toast = useToast()
  const [c, setC] = useState(() => structuredClone(config))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')
  const dirty = useMemo(() => JSON.stringify(ownFields(c)) !== JSON.stringify(ownFields(config)), [c, config])

  const val = (path) => get(c, path) ?? ''
  const set = (path, v) => setC((x) => setIn(x, path, v))

  const upload = async (path, file) => {
    if (!file) return
    setUploading(path)
    try {
      set(path, await store.uploadImage(file))
      toast('Imagen lista. Recuerda guardar.')
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setUploading('')
    }
  }

  // ---------- pasos del proceso ----------
  const steps = c.process?.steps || []
  const setSteps = (next) => set('process.steps', next)
  const move = (i, d) => {
    const j = i + d
    if (j < 0 || j >= steps.length) return
    const next = [...steps]
    ;[next[i], next[j]] = [next[j], next[i]]
    setSteps(next)
  }

  const save = async () => {
    setSaving(true)
    try {
      const saved = await store.updateConfig(ownFields(c))
      setC(structuredClone(saved))
      toast('Cambios publicados en el sitio')
      await reload()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const resetTexts = () => {
    if (!window.confirm('¿Volver todos los textos y diseño a los de fábrica? (no toca WhatsApp, horarios ni dirección)')) return
    const next = structuredClone(SEED_CONFIG)
    OTHER_TABS.forEach((k) => (next[k] = c[k]))
    setC(next)
    toast('Textos de fábrica cargados. Guarda para publicarlos.')
  }

  return (
    <FormCtx.Provider value={{ c, val, set, upload, uploading }}>
    <div className="space-y-4 pb-24">
      <div>
        <h2 className="display text-5xl">Personalizar</h2>
        <p className="mt-1 text-sm text-ash">Todo lo que se lee en el sitio. Edita, luego toca <strong>Guardar y publicar</strong>.</p>
      </div>

      <Section title="Marca y logo" description="Nombre, logo y pestaña del navegador." defaultOpen>
        <div className="flex items-center gap-3 rounded-2xl bg-carbon p-4 sm:col-span-2">
          {val('brand.logo_url') ? (
            <img src={assetUrl(val('brand.logo_url'))} alt="" className="h-9 w-auto max-w-36 object-contain" />
          ) : (
            <DefaultMark />
          )}
          {get(c, 'brand.show_name') !== false && (
            <span className="font-display text-2xl font-extrabold uppercase">
              {val('brand.name')} <span className="text-ember">{val('brand.accent')}</span>
            </span>
          )}
          <span className="ml-auto text-xs text-ash">Vista previa</span>
        </div>
        <Text label="Nombre (parte blanca)" path="brand.name" />
        <Text label="Nombre (parte en color)" path="brand.accent" />
        <Toggle label="Mostrar el nombre junto al logo" path="brand.show_name" wide />
        <ImageField label="Logo" path="brand.logo_url" contain hint="PNG o SVG con fondo transparente, ideal cuadrado o horizontal. Vacío = logo de fábrica. También se usa como ícono de la pestaña." />
      </Section>

      <Section title="Barra de navegación">
        <Text label="Enlace a la carta" path="nav.menu" hint="Vacío = se oculta" />
        <Text label="Enlace a El secreto" path="nav.secret" hint="Vacío = se oculta" />
        <Text label="Enlace a horarios" path="nav.visit" hint="Vacío = se oculta" />
        <Text label="Botón del pedido" path="nav.cart" />
      </Section>

      <Section title="Portada" description="Lo primero que ve el cliente.">
        <Text label="Título grande" path="hero_title" wide />
        <div>
          <label htmlFor="cz-accent" className="label">Palabras en color (desde el final)</label>
          <select id="cz-accent" className="field-dark" value={val('hero_accent_words')} onChange={(e) => set('hero_accent_words', Number(e.target.value))}>
            {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n === 0 ? 'Ninguna' : n}</option>)}
          </select>
        </div>
        <div />
        <Text label="Bajada" path="hero_subtitle" area />
        <Text label="Botón ver menú" path="hero_cta_menu" hint="Vacío = se oculta" />
        <Text label="Botón WhatsApp" path="hero_cta_whatsapp" hint="Vacío = se oculta" />
        <ImageField label="Imagen de portada" path="hero_image" hint="Formato horizontal 4:3 recomendado." />
        <Text label="Descripción de la imagen (accesibilidad)" path="hero_image_alt" wide />
      </Section>

      <Section title="Sello giratorio" description="La rueda amarilla sobre la imagen de portada.">
        <div className="flex items-center gap-5 rounded-2xl bg-carbon p-4 sm:col-span-2">
          <div className="relative size-40 shrink-0">
            <Stamp stamp={c.stamp || {}} className="relative size-full" />
          </div>
          <p className="text-sm text-ash">Vista previa. El texto del anillo se ajusta solo para dar la vuelta completa.</p>
        </div>
        <Toggle label="Mostrar el sello" path="stamp.enabled" wide />
        <Text label="Texto del anillo" path="stamp.ring_text" wide max={60} hint="Separa con · (punto medio). Ideal 25 a 40 caracteres." />
        <Text label="Texto grande del centro" path="stamp.big" max={10} />
        <Text label="Texto pequeño del centro" path="stamp.unit" max={12} />
      </Section>

      <Section title="Carta" description="Títulos, categorías, etiquetas y botones.">
        <Text label="Título de la sección" path="menu_section.title" />
        <Text label="Filtro 'todos'" path="menu_section.all_label" />
        <Text label="Bajada" path="menu_section.subtitle" area />
        <Text label="Botón agregar" path="menu_section.add_label" />
        <Text label="Texto agotado" path="menu_section.soldout_label" />
        <Text label="Mensaje si una categoría está vacía" path="menu_section.empty_text" wide />
        <p className="pt-2 text-sm font-semibold text-gold sm:col-span-2">Nombres de categorías</p>
        {CATEGORIES.map((cat) => <Text key={cat.id} label={cat.label} path={`category_labels.${cat.id}`} />)}
        <p className="pt-2 text-sm font-semibold text-gold sm:col-span-2">Nombres de etiquetas</p>
        {TAGS.map((t) => <Text key={t.id} label={t.label} path={`tag_labels.${t.id}`} />)}
      </Section>

      <Section title="Estados del local" description="Lo que dice el indicador en vivo.">
        {STATUSES.map((s) => (
          <div key={s.id} className="grid gap-3 rounded-2xl bg-carbon p-4 sm:col-span-2 sm:grid-cols-2">
            <Text label={`${s.label}: texto`} path={`status_texts.${s.id}.label`} />
            <Text label="Detalle" path={`status_texts.${s.id}.hint`} />
          </div>
        ))}
      </Section>

      <Section title="El secreto de nuestras brasas" description="Título y pasos del proceso (se animan con el scroll).">
        <Text label="Título" path="process.title" />
        <Text label="Palabra en color" path="process.accent" />
        <div className="space-y-3 sm:col-span-2">
          {steps.map((s, i) => (
            <div key={i} className="rounded-2xl border border-cream/10 bg-carbon p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="tnum font-display text-3xl font-black text-gold">{String(i + 1).padStart(2, '0')}</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="grid size-9 place-items-center rounded-full hover:bg-cream/10 disabled:opacity-30" aria-label={`Subir paso ${i + 1}`}>↑</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === steps.length - 1} className="grid size-9 place-items-center rounded-full hover:bg-cream/10 disabled:opacity-30" aria-label={`Bajar paso ${i + 1}`}>↓</button>
                  <button
                    type="button"
                    onClick={() => steps.length > 1 ? setSteps(steps.filter((_, j) => j !== i)) : toast('Debe quedar al menos un paso', 'error')}
                    className="grid size-9 place-items-center rounded-full text-ash hover:bg-red-500/15 hover:text-red-300"
                    aria-label={`Eliminar paso ${i + 1}`}
                  >
                    <IconTrash width="16" height="16" />
                  </button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="Título del paso" path={`process.steps.${i}.title`} wide />
                <Text label="Texto" path={`process.steps.${i}.text`} area />
                <ImageField label="Imagen" path={`process.steps.${i}.image`} />
              </div>
            </div>
          ))}
          {steps.length < 8 && (
            <button type="button" onClick={() => setSteps([...steps, { title: 'Nuevo paso', text: '', image: '' }])} className="btn btn-ghost w-full">
              <IconPlus /> Agregar paso
            </button>
          )}
        </div>
      </Section>

      <Section title="Horarios y ubicación" description="Textos de la sección (los horarios se editan en Mi negocio).">
        <Text label="Título" path="visit.title" />
        <Text label="Palabra gigante de fondo" path="visit.big_word" />
        <Text label="Introducción" path="visit.intro" wide />
        <Text label="Título tarjeta horarios" path="visit.hours_title" />
        <Text label="Título tarjeta ubicación" path="visit.where_title" />
        <Text label="Texto de ubicación" path="visit.where_text" wide />
        <Text label="Botón Google Maps" path="visit.btn_maps" />
        <Text label="Botón Waze" path="visit.btn_waze" />
        <Text label="Botón WhatsApp" path="visit.btn_whatsapp" />
      </Section>

      <Section title="Pedido y WhatsApp" description="El carrito y el final del mensaje.">
        <Text label="Título del carrito" path="cart.title" />
        <Text label="Botón enviar" path="cart.send_label" />
        <Text label="Carrito vacío: título" path="cart.empty_title" />
        <Text label="Carrito vacío: texto" path="cart.empty_text" />
        <div className="sm:col-span-2">
          <label htmlFor="cz-notes" className="label">Observaciones rápidas (una por línea)</label>
          <textarea
            id="cz-notes"
            rows={4}
            className="field-dark resize-y"
            value={(c.cart?.quick_notes || []).join('\n')}
            onChange={(e) => set('cart.quick_notes', e.target.value.split('\n'))}
          />
        </div>
        <Text label="Cierre del mensaje (retiro)" path="cart.closing_pickup" wide />
        <Text label="Cierre del mensaje (delivery)" path="cart.closing_delivery" wide />
      </Section>

      <Section title="Pie de página">
        <Text label="Frase bajo el logo" path="footer.tagline" wide />
        <Text label="Texto de copyright (va después de © año)" path="footer.copyright" wide />
        <Text label="Enlace al panel" path="footer.admin_label" />
      </Section>

      <Section title="Google y redes (SEO)" description="Cómo aparece el sitio en buscadores y en la pestaña.">
        <Text label="Título de la pestaña" path="seo.title" wide max={70} hint="Ideal menos de 60 caracteres." />
        <Text label="Descripción para Google" path="seo.description" area max={170} />
      </Section>

      <button type="button" onClick={resetTexts} className="text-sm text-ash underline underline-offset-4 hover:text-cream">
        Restaurar textos de fábrica
      </button>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream/10 bg-carbon/95 backdrop-blur">
        <div className="wrap flex items-center justify-between gap-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <span className={`text-sm ${dirty ? 'text-gold' : 'text-ash'}`}>{dirty ? 'Tienes cambios sin guardar' : 'Todo guardado'}</span>
          <div className="flex gap-2">
            {dirty && (
              <button type="button" onClick={() => setC(structuredClone(config))} className="btn min-h-11 px-4 text-sm text-ash hover:text-cream">
                Descartar
              </button>
            )}
            <button type="button" onClick={save} disabled={!dirty || saving || !!uploading} className="btn btn-ember min-h-11 disabled:opacity-50">
              {saving ? 'Publicando…' : 'Guardar y publicar'}
            </button>
          </div>
        </div>
      </div>
    </div>
    </FormCtx.Provider>
  )
}
