import { useRef } from 'react'
import { useStore } from '../context/StoreContext'
import { gsap, useGSAP, MQ, ScrollTrigger } from '../lib/gsap'

// Cinta infinita: avanza sola y, al hacer scroll, acelera según la velocidad
// e invierte la dirección cuando el usuario sube. Texto editable en el admin.
export default function Marquee({ reverse = false, tone = 'ember' }) {
  const { config } = useStore()
  const m = config.marquee || {}
  const text = (m.text || '').trim()
  const root = useRef(null)

  useGSAP(
    () => {
      if (!text) return
      const mm = gsap.matchMedia()
      mm.add(MQ.motion, () => {
        // Dos copias idénticas: desplazar -50% deja la segunda exactamente donde estaba la primera.
        const loop = gsap.fromTo(
          '[data-track]',
          { xPercent: reverse ? -50 : 0 },
          { xPercent: reverse ? 0 : -50, duration: 28, ease: 'none', repeat: -1 },
        )
        let dir = 1
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            dir = self.direction // 1 bajando, -1 subiendo
            const boost = gsap.utils.clamp(1, 6, 1 + Math.abs(self.getVelocity()) / 400)
            gsap.to(loop, { timeScale: dir * boost, duration: 0.2, overwrite: true })
            // Vuelve con suavidad a la velocidad de crucero, manteniendo la última dirección.
            gsap.to(loop, { timeScale: dir > 0 ? 1 : -1, duration: 1.2, delay: 0.2, ease: 'power2.out', overwrite: false })
          },
        })
        // Inclinación leve según la velocidad (sensación cinética).
        const skew = gsap.quickTo('[data-track]', 'skewX', { duration: 0.4, ease: 'power3.out' })
        const stSkew = ScrollTrigger.create({
          trigger: root.current,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => skew(gsap.utils.clamp(-8, 8, self.getVelocity() / -300)),
          onLeave: () => skew(0),
          onLeaveBack: () => skew(0),
        })
        return () => {
          st.kill()
          stSkew.kill()
          loop.kill()
        }
      })
      return () => mm.revert()
    },
    { scope: root, dependencies: [text, reverse], revertOnUpdate: true },
  )

  if (m.enabled === false || !text) return null

  const parts = text.split('•').map((s) => s.trim()).filter(Boolean)
  const colors =
    tone === 'ember'
      ? 'bg-ember text-carbon'
      : 'bg-carbon text-cream border-y border-cream/10'

  const Row = ({ hidden }) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {parts.map((p, i) => (
        <span key={i} className="flex items-center">
          <span
            className={`display px-6 text-[clamp(3rem,9vw,7.5rem)] leading-[1.05] whitespace-nowrap ${
              i % 2 ? (tone === 'ember' ? 'text-transparent [-webkit-text-stroke:2px_#120F0D]' : 'text-transparent [-webkit-text-stroke:2px_#EA580C]') : ''
            }`}
          >
            {p}
          </span>
          <span className={`size-4 shrink-0 rounded-full sm:size-5 ${tone === 'ember' ? 'bg-carbon' : 'bg-ember'}`} />
        </span>
      ))}
    </div>
  )

  return (
    <div ref={root} className={`relative overflow-hidden py-5 select-none sm:py-7 ${colors}`}>
      <p className="sr-only">{parts.join(', ')}</p>
      <div data-track className="marquee-track">
        <Row hidden />
        <Row hidden />
      </div>
    </div>
  )
}
