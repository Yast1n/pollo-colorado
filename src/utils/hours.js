import { DAYS } from '../data/seed'

const toMin = (hhmm) => {
  const [h, m] = String(hhmm || '0:0').split(':').map(Number)
  return h * 60 + (m || 0)
}
const toHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

// Horarios agrupados para mostrar: [{ days: 'Martes a Jueves', text: '12:00 – 20:00' }]
export function groupHours(hours = []) {
  const order = [1, 2, 3, 4, 5, 6, 0] // lunes primero
  const rows = []
  for (const d of order) {
    const h = hours[d]
    if (!h) continue
    const text = h.closed ? 'Cerrado' : `${h.open} – ${h.close}`
    const last = rows[rows.length - 1]
    if (last && last.text === text) {
      last.to = d
      last.idx.push(d)
    } else rows.push({ from: d, to: d, text, idx: [d] })
  }
  return rows.map((r) => ({
    days: r.from === r.to ? DAYS[r.from] : `${DAYS[r.from]} a ${DAYS[r.to]}`,
    text: r.text,
    idx: r.idx, // días (0 = domingo) que cubre la fila
  }))
}

// Franjas de 15 min para hoy, desde ahora + 30 min hasta el cierre.
// Si hoy no quedan franjas, ofrece las de mañana (pedidos agendados).
export function timeSlots(hours = [], now = chileNow()) {
  const build = (dayIdx, fromMin, prefix) => {
    const h = hours[dayIdx]
    if (!h || h.closed) return []
    const start = Math.max(toMin(h.open), Math.ceil(fromMin / 15) * 15)
    const end = toMin(h.close) - 15
    const out = []
    for (let m = start; m <= end; m += 15) out.push(`${prefix}${toHHMM(m)}`)
    return out
  }
  const today = build(now.getDay(), now.getHours() * 60 + now.getMinutes() + 30, '')
  if (today.length) return { label: 'Hoy', slots: today }
  for (let i = 1; i <= 7; i++) {
    const d = (now.getDay() + i) % 7
    const s = build(d, 0, '')
    if (s.length) return { label: i === 1 ? 'Mañana' : DAYS[d], slots: s }
  }
  return { label: 'Hoy', slots: [] }
}

export function todayHours(hours = [], now = chileNow()) {
  const h = hours[now.getDay()]
  if (!h || h.closed) return 'Hoy cerrado'
  return `Hoy ${h.open} – ${h.close}`
}

// Hora local de Chile (el local está en Pirque), aunque el visitante tenga otro huso horario.
// Devuelve un Date "de pared": getDay/getHours/getMinutes corresponden a America/Santiago.
export function chileNow(d = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    }).formatToParts(d)
    const p = Object.fromEntries(parts.map((x) => [x.type, x.value]))
    return new Date(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute)
  } catch {
    return d
  }
}

// ¿Está abierto según el horario? Si no, cuándo abre. { open, closes } | { open: false, opens, day }
export function openState(hours = [], now = chileNow()) {
  const d = now.getDay()
  const min = now.getHours() * 60 + now.getMinutes()
  const h = hours[d]
  if (h && !h.closed && min >= toMin(h.open) && min < toMin(h.close)) return { open: true, closes: h.close }
  for (let i = 0; i <= 7; i++) {
    const dd = (d + i) % 7
    const x = hours[dd]
    if (!x || x.closed || (i === 0 && min >= toMin(x.open))) continue
    return { open: false, opens: x.open, day: i === 0 ? 'hoy' : i === 1 ? 'mañana' : DAYS[dd].toLowerCase() }
  }
  return { open: false }
}

// "hoy" / "mañana" / "el martes"
export const dayPhrase = (day) => (day === 'hoy' || day === 'mañana' ? day : `el ${day}`)

// Fecha de hoy en Chile como "AAAA-MM-DD" (para cambios de estado que valen solo por hoy).
export function chileDateKey(now = chileNow()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// ¿El estado lo decide el horario en este momento? (modo automático y sin cambio manual de hoy)
export function scheduleDriven(config, now = chileNow()) {
  return Boolean(config?.status_auto && config?.hours?.length === 7 && config.status_date !== chileDateKey(now))
}

// Estado que ve el cliente.
// - Automático: el horario decide Abierto/Cerrado; un cambio manual en el panel manda solo por ese día.
// - Manual: el del admin manda, salvo "Abierto" fuera de horario, que se muestra como
//   "Agendando pedidos" (no prometemos pollos con el local cerrado).
export function effectiveStatus(config, now = chileNow()) {
  const s = config?.status || 'open'
  if (!config?.hours?.length) return s
  if (config.status_auto) {
    if (!scheduleDriven(config, now)) return s
    return openState(config.hours, now).open ? 'open' : 'closed'
  }
  if (s !== 'open') return s
  return openState(config.hours, now).open ? 'open' : 'scheduling'
}

// Texto "cuándo abrimos" para el estado Cerrado puesto por el horario: "Abrimos mañana a las 12:00".
export function nextOpeningHint(config, now = chileNow()) {
  if (!scheduleDriven(config, now)) return null
  const os = openState(config.hours, now)
  return !os.open && os.opens ? `Abrimos ${dayPhrase(os.day)} a las ${os.opens}` : null
}
