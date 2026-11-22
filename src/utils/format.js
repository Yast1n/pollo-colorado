const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

export const formatCLP = (n) => clp.format(Math.round(Number(n) || 0))

// Resuelve rutas relativas de /public respetando el `base` de Vite (GitHub Pages).
export function assetUrl(src) {
  if (!src) return ''
  if (/^(https?:|data:|blob:)/.test(src)) return src
  return `${import.meta.env.BASE_URL}${src.replace(/^\.?\//, '')}`
}

export const onlyDigits = (s) => String(s || '').replace(/\D/g, '')
