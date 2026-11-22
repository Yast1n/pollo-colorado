import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const push = useCallback((text, type = 'ok') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, text, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), type === 'error' ? 6000 : 2800)
  }, [])
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((t) => (
          <p
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto max-w-md rounded-full px-5 py-3 text-sm font-semibold shadow-2xl motion-safe:animate-[toast-in_.35s_var(--ease-out-expo)] ${
              t.type === 'error' ? 'bg-red-600 text-white' : 'bg-cream text-carbon'
            }`}
          >
            {t.text}
          </p>
        ))}
      </div>
      <style>{'@keyframes toast-in{from{opacity:0;transform:translateY(12px) scale(.96)}}'}</style>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
