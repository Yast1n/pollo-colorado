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
    if (last && last.text === text) last.to = d
    else rows.push({ from: d, to: d, text })
  }
  return rows.map((r) => ({
    days: r.from === r.to ? DAYS[r.from] : `${DAYS[r.from]} a ${DAYS[r.to]}`,
    text: r.text,
  }))
}

// Franjas de 15 min para hoy, desde ahora + 30 min hasta el cierre.
// Si hoy no quedan franjas, ofrece las de mañana (pedidos agendados).
export function timeSlots(hours = [], now = new Date()) {
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

export function todayHours(hours = [], now = new Date()) {
  const h = hours[now.getDay()]
  if (!h || h.closed) return 'Hoy cerrado'
  return `Hoy ${h.open} – ${h.close}`
}
