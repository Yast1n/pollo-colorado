import { useEffect, useRef } from 'react'

// Chispas de brasa que suben. Canvas 2D liviano: se pausa fuera de pantalla,
// con la pestaña oculta y queda estático con prefers-reduced-motion.
export default function EmberField({ className = '', density = 1 }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    let w = 0
    let h = 0
    let raf = 0
    let visible = true
    let particles = []

    const spawn = (anywhere) => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      r: 0.6 + Math.random() * 2.2,
      vy: 0.25 + Math.random() * 0.9,
      vx: (Math.random() - 0.5) * 0.3,
      sway: Math.random() * Math.PI * 2,
      life: 0.4 + Math.random() * 0.6,
      hue: Math.random() > 0.35 ? 24 : 40, // brasa o dorado
    })

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round(Math.min(90, (w * h) / 16000) * density)
      particles = Array.from({ length: count }, () => spawn(true))
      if (reduce) draw()
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'
      for (const p of particles) {
        const fade = Math.min(1, p.y / h) * p.life
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4)
        g.addColorStop(0, `hsla(${p.hue}, 95%, 62%, ${fade})`)
        g.addColorStop(1, `hsla(${p.hue}, 95%, 50%, 0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const tick = () => {
      for (const p of particles) {
        p.sway += 0.02
        p.y -= p.vy
        p.x += p.vx + Math.sin(p.sway) * 0.25
        if (p.y < -10) Object.assign(p, spawn(false))
      }
      draw()
      raf = requestAnimationFrame(tick)
    }

    const start = () => {
      if (reduce || raf || !visible || document.hidden) return
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      visible ? start() : stop()
    })
    io.observe(canvas)
    const onVis = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVis)

    resize()
    start()
    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [density])

  return <canvas ref={ref} className={`pointer-events-none ${className}`} aria-hidden="true" />
}
