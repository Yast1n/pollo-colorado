import { useLayoutEffect, useRef } from 'react'
import { gsap, prefersReduced } from '../lib/gsap'
import { formatCLP } from '../utils/format'

// Precio que "rueda" hasta su nuevo valor cuando cambia (total del pedido).
// El texto se escribe directo en el nodo para no pelear con React en cada frame.
export default function AnimatedPrice({ value, className = '' }) {
  const el = useRef(null)
  const shown = useRef(null)

  useLayoutEffect(() => {
    const node = el.current
    if (!node) return
    const from = shown.current
    if (from === null || from === value || prefersReduced()) {
      shown.current = value
      node.textContent = formatCLP(value)
      return
    }
    const proxy = { v: from }
    const tw = gsap.to(proxy, {
      v: value,
      duration: 0.6,
      ease: 'expo.out',
      onUpdate: () => {
        shown.current = Math.round(proxy.v)
        node.textContent = formatCLP(shown.current)
      },
      onComplete: () => {
        shown.current = value
        node.textContent = formatCLP(value)
      },
    })
    return () => tw.kill()
  }, [value])

  return <span ref={el} className={`tnum ${className}`} />
}
