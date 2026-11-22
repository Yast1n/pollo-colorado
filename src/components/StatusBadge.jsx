import { useEffect, useState } from 'react'
import { STATUSES } from '../data/seed'
import { useStore } from '../context/StoreContext'
import { effectiveStatus } from '../utils/hours'

// Estado efectivo para el cliente (admin + horario), recalculado cada minuto.
export function useStoreStatus() {
  const { config } = useStore()
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 60_000)
    return () => clearInterval(t)
  }, [])
  return effectiveStatus(config)
}

export const STATUS_STYLES = {
  open: { dot: 'bg-emerald-400', ring: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200', pulse: true },
  scheduling: { dot: 'bg-gold', ring: 'border-gold/40 bg-gold/10 text-amber-100', pulse: true },
  soldout: { dot: 'bg-ember', ring: 'border-ember/50 bg-ember/15 text-orange-100', pulse: false },
  closed: { dot: 'bg-ash', ring: 'border-cream/20 bg-cream/5 text-ash', pulse: false },
}

// Textos del estado: los del admin (config.status_texts) o los de fábrica.
export function statusInfo(id, config) {
  const base = STATUSES.find((s) => s.id === id) || STATUSES[0]
  const custom = config?.status_texts?.[base.id] || {}
  return { ...base, label: custom.label || base.label, hint: custom.hint ?? base.hint }
}

export default function StatusBadge({ status, showHint = true, className = '' }) {
  const { config } = useStore()
  const s = statusInfo(status, config)
  const st = STATUS_STYLES[s.id] || STATUS_STYLES.open
  return (
    <span
      className={`inline-flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 text-sm font-medium backdrop-blur ${st.ring} ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex size-2.5">
        {st.pulse && <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-70 ${st.dot}`} />}
        <span className={`relative inline-flex size-2.5 rounded-full ${st.dot}`} />
      </span>
      <span>{s.label}</span>
      {showHint && s.hint && (
        <span className="hidden border-l border-current/25 pl-2.5 opacity-75 sm:inline">{s.hint}</span>
      )}
    </span>
  )
}
