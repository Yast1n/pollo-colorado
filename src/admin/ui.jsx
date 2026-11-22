export function Card({ title, description, children, className = '' }) {
  return (
    <section className={`rounded-3xl border border-cream/10 bg-carbon-2 p-5 sm:p-7 ${className}`}>
      {title && <h2 className="font-display text-3xl font-extrabold">{title}</h2>}
      {description && <p className="mt-1 text-sm text-ash">{description}</p>}
      <div className={title || description ? 'mt-5' : ''}>{children}</div>
    </section>
  )
}

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50 ${
        checked ? 'bg-emerald-500' : 'bg-cream/20'
      }`}
    >
      <span
        className={`inline-block size-5 rounded-full bg-white shadow transition-transform duration-200 ease-[var(--ease-out-expo)] ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
