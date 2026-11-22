import { useRef } from 'react'
import { useStore } from '../context/StoreContext'
import { gsap, useGSAP, MQ } from '../lib/gsap'
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
          <text
            fontSize="10.5"
            fontWeight="700"
            fill="#120F0D"
            fontFamily="Inter, sans-serif"
            textLength="285"
            lengthAdjust="spacingAndGlyphs"
          >
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

export default function Hero() {
  const { config } = useStore()
  const root = useRef(null)
  const words = (config.hero_title || '').split(/\s+/).filter(Boolean)
  const accentFrom = words.length - Math.max(0, Number(config.hero_accent_words) || 0)
  const stamp = config.stamp || {}

  // Coreografía: la brasa se enciende → título palabra a palabra → contexto → acciones → el plato aterriza.
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MQ.motion, () => {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
        tl.from('[data-glow]', { opacity: 0, scale: 0.7, duration: 1.4, ease: 'power2.out' })
          .from('[data-word]', { yPercent: 115, duration: 1.1, stagger: 0.07 }, 0.15)
          .from('[data-badge]', { y: 14, opacity: 0, duration: 0.7 }, 0.35)
          .from('[data-sub]', { y: 18, opacity: 0, duration: 0.8 }, 0.6)
          .from('[data-cta] > *', { y: 18, opacity: 0, duration: 0.7, stagger: 0.08 }, 0.72)
          .from('[data-dish]', { y: 60, scale: 0.92, rotate: -6, opacity: 0, duration: 1.4 }, 0.4)
        if (root.current.querySelector('[data-stamp]')) {
          tl.from('[data-stamp]', { scale: 0, rotate: -120, duration: 1.2, ease: 'back.out(1.6)' }, 1.0)
          gsap.to('[data-stamp-ring]', { rotate: 360, duration: 28, ease: 'none', repeat: -1 })
        }

        // Parallax suave: solo el plato y el resplandor (nunca el texto).
        const st = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true }
        gsap.to('[data-dish]', { yPercent: 14, ease: 'none', scrollTrigger: st })
        gsap.to('[data-glow]', { yPercent: 30, opacity: 0.4, ease: 'none', scrollTrigger: { ...st } })
      })
      return () => mm.revert()
    },
    { scope: root, dependencies: [config.hero_title, stamp.enabled], revertOnUpdate: true },
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
      <EmberField className="absolute inset-0 -z-10 size-full" />

      <div className="wrap grid items-center gap-10 md:grid-cols-12">
        <div className="md:col-span-7">
          <div data-badge>
            <StatusBadge status={config.status} />
          </div>

          <h1 className="display mt-6 text-[clamp(3.4rem,10.5vw,8rem)] text-cream">
            {words.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.06em] align-bottom">
                <span data-word className={`inline-block ${i >= accentFrom ? 'text-ember' : ''}`}>
                  {w}
                </span>
                {i < words.length - 1 && <span>&nbsp;</span>}
              </span>
            ))}
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
              <a
                href={whatsappLink(config.whatsapp, config.greeting)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost text-base"
              >
                <IconWhatsApp className="text-[#25D366]" /> {config.hero_cta_whatsapp}
              </a>
            )}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md md:col-span-5 md:max-w-none">
          {config.hero_image && (
            <img
              data-dish
              src={assetUrl(config.hero_image)}
              alt={config.hero_image_alt || ''}
              width="800"
              height="600"
              fetchPriority="high"
              className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-[0_40px_120px_-30px_rgb(234_88_12/0.55)]"
            />
          )}
          {stamp.enabled !== false && (stamp.big || stamp.ring_text) && (
            <div data-stamp className="absolute -top-8 -right-1 size-28 sm:size-40 md:top-auto md:right-auto md:-bottom-8 md:-left-12">
              <Stamp stamp={stamp} className="relative size-full" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
