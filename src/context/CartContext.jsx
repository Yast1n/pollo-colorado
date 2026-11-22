import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useStore } from './StoreContext'

const CartContext = createContext(null)
const KEY = 'pc:cart:v1'

export function CartProvider({ children }) {
  const { products } = useStore()
  const [lines, setLines] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}')
    } catch {
      return {}
    }
  })
  const [open, setOpen] = useState(false)
  const [bump, setBump] = useState(0) // cambia en cada "agregar" para animar el botón del carrito

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines))
    } catch {
      /* sin almacenamiento: el carrito vive solo en memoria */
    }
  }, [lines])

  // Ítems con datos actuales del menú (precio/disponibilidad pueden cambiar desde el admin).
  const items = useMemo(
    () =>
      Object.entries(lines)
        .map(([id, qty]) => {
          const p = products.find((x) => x.id === id)
          return p ? { ...p, qty } : null
        })
        .filter(Boolean),
    [lines, products],
  )

  const count = items.reduce((s, i) => s + i.qty, 0)
  const total = items.reduce((s, i) => s + i.qty * i.price, 0)

  const add = (id) => {
    setLines((l) => ({ ...l, [id]: Math.min(20, (l[id] || 0) + 1) }))
    setBump((b) => b + 1)
  }
  const setQty = (id, qty) =>
    setLines((l) => {
      const next = { ...l }
      if (qty <= 0) delete next[id]
      else next[id] = Math.min(20, qty)
      return next
    })
  const clear = () => setLines({})

  return (
    <CartContext.Provider value={{ items, count, total, add, setQty, clear, open, setOpen, bump }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
