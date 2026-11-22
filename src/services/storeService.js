// Capa de datos dual: Supabase (si hay .env) o Modo Demo Local (localStorage).
// La UI solo habla con este módulo; nunca con Supabase ni localStorage directamente.
import { supabase, isSupabaseConfigured, IMAGE_BUCKET } from '../lib/supabase'
import { SEED_CONFIG, SEED_PRODUCTS, CATEGORIES } from '../data/seed'
import { compressImage, blobToDataURL } from '../utils/image'

export const mode = isSupabaseConfigured ? 'supabase' : 'local'
export const isRemote = mode === 'supabase'

const LS = {
  products: 'pc:products:v1',
  config: 'pc:config:v1',
  session: 'pc:demo-session:v1',
}
const CHANGE_EVENT = 'pc:store-change'

// Orden de la carta: primero por categoría (en el orden de CATEGORIES), luego por sort_order.
const catIndex = (c) => {
  const i = CATEGORIES.findIndex((x) => x.id === c)
  return i < 0 ? CATEGORIES.length : i
}
const sortProducts = (list) =>
  [...list].sort(
    (a, b) =>
      catIndex(a.category) - catIndex(b.category) ||
      (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
      a.name.localeCompare(b.name),
  )

const normalizeProduct = (p) => ({
  id: p.id,
  name: p.name ?? '',
  description: p.description ?? '',
  category: p.category ?? 'pollos',
  price: Number(p.price) || 0,
  weight_label: p.weight_label ?? '',
  portions: p.portions ?? '',
  image_url: p.image_url ?? '',
  tags: Array.isArray(p.tags) ? p.tags : [],
  available: p.available !== false,
  sort_order: Number(p.sort_order) || 0,
})

const withConfigDefaults = (data) => ({
  ...SEED_CONFIG,
  ...(data || {}),
  socials: { ...SEED_CONFIG.socials, ...(data?.socials || {}) },
  hours: Array.isArray(data?.hours) && data.hours.length === 7 ? data.hours : SEED_CONFIG.hours,
})

// ---------- Local ----------
function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    throw new Error(
      e?.name === 'QuotaExceededError'
        ? 'Sin espacio en el navegador. En modo demo usa imágenes más pequeñas o una URL externa.'
        : 'No se pudo guardar en este navegador.',
    )
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}
const localProducts = () => readLS(LS.products, SEED_PRODUCTS).map(normalizeProduct)
const newId = () => crypto.randomUUID?.() ?? `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

// ---------- API pública ----------
export async function getProducts() {
  if (!isRemote) return sortProducts(localProducts())
  const { data, error } = await supabase.from('products').select('*').order('sort_order')
  if (error) throw friendly(error)
  return sortProducts(data.map(normalizeProduct))
}

export async function getConfig() {
  if (!isRemote) return withConfigDefaults(readLS(LS.config, SEED_CONFIG))
  const { data, error } = await supabase.from('site_config').select('data').eq('id', 1).maybeSingle()
  if (error) throw friendly(error)
  return withConfigDefaults(data?.data)
}

export async function updateConfig(patch) {
  const next = withConfigDefaults({ ...(await getConfig()), ...patch })
  if (!isRemote) {
    writeLS(LS.config, next)
    return next
  }
  const { error } = await supabase
    .from('site_config')
    .upsert({ id: 1, data: next, updated_at: new Date().toISOString() })
  if (error) throw friendly(error)
  return next
}

export async function saveProduct(product) {
  const p = normalizeProduct({ ...product, id: product.id || newId() })
  if (!isRemote) {
    const list = localProducts()
    const i = list.findIndex((x) => x.id === p.id)
    if (i >= 0) list[i] = p
    else list.push(p)
    writeLS(LS.products, list)
    return p
  }
  const { data, error } = await supabase.from('products').upsert(p).select().single()
  if (error) throw friendly(error)
  return normalizeProduct(data)
}

export async function deleteProduct(id) {
  if (!isRemote) {
    writeLS(LS.products, localProducts().filter((p) => p.id !== id))
    return
  }
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw friendly(error)
}

export async function setAvailability(id, available) {
  if (!isRemote) {
    writeLS(
      LS.products,
      localProducts().map((p) => (p.id === id ? { ...p, available } : p)),
    )
    return
  }
  const { error } = await supabase.from('products').update({ available }).eq('id', id)
  if (error) throw friendly(error)
}

// Sube una imagen (comprimida) y devuelve su URL pública.
export async function uploadImage(file) {
  const blob = await compressImage(file)
  if (!isRemote) {
    if (blob.size > 900_000) throw new Error('Imagen demasiado pesada para el modo demo (máx. ~900 KB tras comprimir).')
    return blobToDataURL(blob)
  }
  const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg'
  const path = `productos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, blob, { contentType: blob.type || 'image/jpeg', cacheControl: '31536000', upsert: false })
  if (error) throw friendly(error)
  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl
}

export function resetDemoData() {
  if (isRemote) return
  localStorage.removeItem(LS.products)
  localStorage.removeItem(LS.config)
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

// Escucha cambios: en Supabase vía Realtime; en local vía evento propio + `storage` (otras pestañas).
export function subscribe(onChange) {
  if (!isRemote) {
    const onStorage = (e) => {
      if (!e.key || e.key.startsWith('pc:')) onChange()
    }
    window.addEventListener(CHANGE_EVENT, onChange)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange)
      window.removeEventListener('storage', onStorage)
    }
  }
  const channel = supabase
    .channel('pc-store')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'site_config' }, onChange)
    .subscribe()
  return () => supabase.removeChannel(channel)
}

// ---------- Auth ----------
export async function signIn(email, password) {
  if (!isRemote) {
    if (!email?.trim() || !password) throw new Error('Ingresa email y contraseña.')
    const session = { user: { email: email.trim(), demo: true } }
    sessionStorage.setItem(LS.session, JSON.stringify(session))
    return session
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw friendly(error)
  return data.session
}

export async function signOut() {
  if (!isRemote) {
    sessionStorage.removeItem(LS.session)
    return
  }
  await supabase.auth.signOut()
}

export async function getSession() {
  if (!isRemote) {
    try {
      return JSON.parse(sessionStorage.getItem(LS.session) || 'null')
    } catch {
      return null
    }
  }
  const { data } = await supabase.auth.getSession()
  return data.session
}

export function onAuthChange(cb) {
  if (!isRemote) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_e, session) => cb(session))
  return () => data.subscription.unsubscribe()
}

// Comprueba si el usuario logueado está en la lista blanca `admin_users` (ver schema.sql).
export async function isAdmin() {
  if (!isRemote) return true
  const { data, error } = await supabase.rpc('is_admin')
  if (error) return false
  return data === true
}

function friendly(error) {
  const msg = error?.message || String(error)
  if (/Invalid login credentials/i.test(msg)) return new Error('Email o contraseña incorrectos.')
  if (/row-level security|permission denied|violates/i.test(msg))
    return new Error('Sin permiso: tu usuario no está en la lista de administradores (tabla admin_users).')
  if (/Failed to fetch|NetworkError/i.test(msg)) return new Error('Sin conexión con el servidor. Revisa tu internet.')
  if (/Bucket not found/i.test(msg)) return new Error('Falta el bucket "menu-images". Ejecuta supabase/migrations/20261122000000_init.sql.')
  return new Error(msg)
}
