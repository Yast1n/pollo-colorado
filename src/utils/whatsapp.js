import { formatCLP, onlyDigits } from './format'

export function buildOrderMessage({ config, items, mode, time, timeDayLabel, address, name, notes }) {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  const lines = []
  lines.push(config.greeting?.trim() || 'Hola, quiero consultar este pedido:')
  lines.push('')
  lines.push('*PEDIDO*')
  for (const i of items) {
    lines.push(`• ${i.qty} × ${i.name} — ${formatCLP(i.price * i.qty)}`)
  }
  lines.push('')
  lines.push(`*Total estimado:* ${formatCLP(total)}`)
  lines.push('')
  lines.push(`*Modalidad:* ${mode === 'delivery' ? 'Delivery en Pirque' : 'Retiro en local'}`)
  lines.push(
    `*Hora ${mode === 'delivery' ? 'de entrega' : 'de retiro'}:* ${
      time === 'asap' ? 'Lo antes posible' : `${timeDayLabel} ${time} hrs`
    }`,
  )
  if (mode === 'delivery' && address?.trim()) lines.push(`*Dirección:* ${address.trim()}`)
  if (name?.trim()) lines.push(`*Nombre:* ${name.trim()}`)
  if (notes?.trim()) lines.push(`*Observaciones:* ${notes.trim()}`)
  lines.push('')
  lines.push(
    mode === 'delivery'
      ? '¿Tienen disponibilidad y cuánto sería el envío? ¡Gracias!'
      : '¿Me confirman disponibilidad para esa hora? ¡Gracias!',
  )
  return lines.join('\n')
}

export function whatsappLink(number, text = '') {
  const n = onlyDigits(number)
  const q = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${n}${q}`
}

export function mapsLinks(query) {
  const q = encodeURIComponent(query || 'Pirque, Chile')
  return {
    google: `https://www.google.com/maps/search/?api=1&query=${q}`,
    waze: `https://waze.com/ul?q=${q}&navigate=yes`,
  }
}
