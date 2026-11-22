import { useRef } from 'react'
import { useStore } from '../context/StoreContext'
import { gsap, useGSAP, MQ, SplitText } from '../lib/gsap'
import { assetUrl } from '../utils/format'
import { whatsappLink } from '../utils/whatsapp'
import EmberField from './EmberField'
import StatusBadge from './StatusBadge'
import { IconArrowDown, IconWhatsApp } from './Icons'

export function Stamp({ stamp, className = '' }) {
  const ring = (stamp.ring_text || '').trim()
  return (
    <div className={`grid place-items-center ${className}`} role="img" aria-label={`${stamp.big} ${stamp.unit}`.trim()}>
      <svg data-stamp-ring viewBox="0 0 120 120" className="absolute inset-0 size-full" aria-hidden="true">
        <defs>
          <path id="stamp-circle" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0" />
        </defs>
        <circle cx="60" cy="60" r="58" fill="#F59E0B" />
        {ring && (
          <text fontSize="10.5" fontWeight="700" fill="#120F0D" fontFamily="Inter, sans-serif" textLength="285" lengthAdjust="spacingAndGlyphs">
            <textPath href="#stamp-circle">{ring}</textPath>
          </text>
        )}
      </svg>
      <span className="relative text-center font-display leading-none font-black text-carbon">
        <span className="block text-[1.2rem] sm:text-[1.75rem]">{stamp.big}</span>
        {stamp.unit && <span className="text-sm sm:text-base">{stamp.unit}</span>}
      </span>
    </div>
  )
}

// Capas de humo: posiciones/tiempos distintos para que nunca se vea un patrón.
const SMOKE = [
  { '--x': '5%', '--d': '11s', '--delay': '0s', '--dx': '12%' },
  { '--x': '38%', '--d': '9s', '--delay': '-3.5s', '--dx': '-8%' },
  { '--x': '62%', '--d': '12s', '--delay': '-7s', '--dx': '6%' },
]

export default function Hero() {
  const { config } = useStore()
  const root = useRef(null)
  const title = useRef(null)
  const words = (config.hero_title || '').split(/\s+/).filter(Boolean)
  const accentFrom = Math.max(0, words.length - Math.max(0, Number(config.hero_accent_words) || 0))
  const plain = words.slice(0, accentFrom).join(' ')
  const accent = words.slice(accentFrom).join(' ')
  const stamp = config.stamp || {}
  const hasStamp = stamp.enabled !== false && Boolean(stamp.big || stamp.ring_text)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(MQ.motion, () => {
        let split
        let alive = true
        const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 1 }, paused: true })

        // Estado inicial (síncrono: nada parpadea antes de animar).
        gsap.set(title.current, { autoAlpha: 0 })

        tl.addLabel('ignite')
          .from('[data-glow]', { opacity: 0, scale: 0.7, duration: 1.6, ease: 'power2.out' }, 'ignite')
          .from('[data-frame]', { clipPath: 'inset(100% 0% 0% 0% round 2rem)', duration: 1.4, ease: 'expo.inOut' }, 'ignite+=0.1')
          .from('[data-dish]', { scale: 1.35, duration: 2, ease: 'expo.out' }, 'ignite+=0.3')
          .addLabel('title', 'ignite+=0.25')
          .from('[data-badge]', { y: 14, opacity: 0, duration: 0.7 }, 'title+=0.2')
          .from('[data-sub]', { y: 18, opacity: 0, duration: 0.8 }, 'title+=0.55')
          .from('[data-cta] > *', { y: 18, opacity: 0, duration: 0.7, stagger: 0.08 }, 'title+=0.7')
          .from('[data-ticks]', { opacity: 0, scale: 1.06, duration: 0.8 }, 'title+=0.9')
        if (root.current.querySelector('[data-stamp]')) {
          tl.from('[data-stamp]', { scale: 0, rotate: -160, duration: 1.3, ease: 'back.out(1.6)' }, 'title+=0.85')
        }

        // El título se parte en líneas con máscara cuando las fuentes ya cargaron (líneas correctas).
        document.fonts.ready.then(() => {
          if (!alive || !title.current) return
          split = SplitText.create(title.current, { type: 'lines', mask: 'lines' })
          gsap.set(title.current, { autoAlpha: 1 })
          tl.from(split.lines, { yPercent: 110, duration: 1.2, stagger: 0.1, ease: 'expo.out' }, 'title')
          // Al terminar se deshace el split: el título vuelve a ser texto normal (responsive y accesible).
          tl.eventCallback('onComplete', () => {
            split?.revert()
            split = null
          })
          tl.play()
        })

        // El sello gira con el scroll (scrub suavizado).
        if (root.current.querySelector('[data-stamp-ring]')) {
          gsap.to('[data-stamp-ring]', {
            rotate: 360,
            ease: 'none',
            scrollTrigger: { trigger: root.current, start: 'top top', end: '+=1400', scrub: 1 },
          })
        }

        // Parallax de salida: el marco baja más lento que la página; el resplandor se apaga.
        const out = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true }
        gsap.to('[data-visual]', { yPercent: 12, ease: 'none', scrollTrigger: out })
        gsap.to('[data-glow]', { yPercent: 30, opacity: 0.35, ease: 'none', scrollTrigger: { ...out } })

        return () => {
          alive = false
          split?.revert()
          tl.kill()
        }
      })

      // Parallax con el cursor (solo mouse): cada capa se mueve según su profundidad.
      mm.add(`${MQ.motion} and ${MQ.fine}`, () => {
        const el = root.current
        const layers = gsap.utils.toArray('[data-depth]', el).map((node) => ({
          d: Number(node.dataset.depth),
          x: gsap.quickTo(node, 'x', { duration: 0.9, ease: 'power3.out' }),
          y: gsap.quickTo(node, 'y', { duration: 0.9, ease: 'power3.out' }),
        }))
        const onMove = (e) => {
          const r = el.getBoundingClientRect()
          const nx = (e.clientX - r.left) / r.width - 0.5
          const ny = (e.clientY - r.top) / r.height - 0.5
          layers.forEach((l) => {
            l.x(nx * l.d * 28)
            l.y(ny * l.d * 20)
          })
        }
        const onLeave = () => layers.forEach((l) => (l.x(0), l.y(0)))
        el.addEventListener('pointermove', onMove)
        el.addEventListener('pointerleave', onLeave)
        return () => {
          el.removeEventListener('pointermove', onMove)
          el.removeEventListener('pointerleave', onLeave)
        }
      })

      return () => mm.revert()
    },
    { scope: root, dependencies: [plain, accent, hasStamp, config.hero_image], revertOnUpdate: true },
  )

  return (
    <section
      ref={root}
      id="top"
      className="grain relative isolate -mt-16 flex min-h-[100svh] items-center overflow-hidden pt-24 pb-14"
    >
      <div
        data-glow
        aria-hidden="true"
        className="absolute inset-x-[-20%] bottom-[-35%] -z-10 h-[85%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(234_88_12/0.55),rgb(194_65_12/0.25)_45%,transparent)] blur-2xl"
      />
      {/* Chispas de fondo: finas y nítidas */}
      <div data-depth="0.4" className="absolute inset-0 -z-10" aria-hidden="true">
        <EmberField className="size-full" />
      </div>

      <div className="wrap grid items-center gap-12 md:grid-cols-12">
        <div className="relative z-10 md:col-span-7">
          <div data-badge>
            <StatusBadge status={config.status} />
          </div>

          <h1 key={`${plain}|${accent}`} ref={title} className="display mt-6 text-[clamp(3.4rem,10.5vw,8rem)] text-cream">
            {plain}
            {plain && accent ? ' ' : ''}
            {accent && <span className="text-ember">{accent}</span>}
          </h1>

          {config.hero_subtitle && (
            <p data-sub className="mt-6 max-w-xl text-lg leading-relaxed text-ash sm:text-xl">
              {config.hero_subtitle}
            </p>
          )}

          <div data-cta className="mt-9 flex flex-col gap-3 sm:flex-row">
            {config.hero_cta_menu && (
              <a href="#menu" className="btn btn-ember text-base">
                {config.hero_cta_menu} <IconArrowDown />
              </a>
            )}
            {config.hero_cta_whatsapp && (
              <a href={whatsappLink(config.whatsapp, config.greeting)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost text-base">
                <IconWhatsApp className="text-[#25D366]" /> {config.hero_cta_whatsapp}
              </a>
            )}
          </div>
        </div>

        {/* Visual editorial: marco, foto, luz de brasa, humo y sello */}
        <div data-visual className="relative mx-auto w-full max-w-md md:col-span-5 md:max-w-none">
          <div
            data-depth="0.6"
            aria-hidden="true"
            className="absolute -inset-10 -z-10 rounded-[3rem] bg-[radial-gradient(closest-side,rgb(234_88_12/0.5),transparent)] blur-2xl"
          />
          <div data-depth="1" className="relative">
            <div data-ticks className="frame-ticks absolute inset-0" aria-hidden="true">
              <i />
            </div>
            <div
              data-frame
              className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-carbon-2 shadow-[0_50px_120px_-30px_rgb(234_88_12/0.55)] ring-1 ring-cream/15 sm:aspect-[4/4.4]"
            >
              {config.hero_image && (
                <img
                  data-dish
                  src={assetUrl(config.hero_image)}
                  alt={config.hero_image_alt || ''}
                  width="960"
                  height="720"
                  fetchPriority="high"
                  className="size-full object-cover"
                />
              )}
              <div className="ember-light" aria-hidden="true" />
              <div className="smoke" aria-hidden="true">
                {SMOKE.map((s, i) => (
                  <span key={i} style={s} />
                ))}
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-[2rem] shadow-[inset_0_0_80px_rgb(18_15_13/0.65)]" aria-hidden="true" />
            </div>
          </div>
          {hasStamp && (
            <div data-depth="1.5" className="absolute -top-8 -right-2 size-28 sm:size-40 md:top-auto md:right-auto md:-bottom-10 md:-left-14">
              <div data-stamp className="relative size-full">
                <Stamp stamp={stamp} className="relative size-full" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chispas de primer plano: grandes, desenfocadas, se mueven más con el cursor (profundidad) */}
      <div data-depth="1.8" className="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
        <EmberField className="size-full blur-[2.5px]" density={0.12} size={3.2} speed={1.7} />
      </div>
    </section>
  )
}
