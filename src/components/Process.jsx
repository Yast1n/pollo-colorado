import { useRef } from 'react'
import { useStore } from '../context/StoreContext'
import { gsap, useGSAP, MQ } from '../lib/gsap'
import { assetUrl } from '../utils/format'

function Title({ title, accent, className }) {
  return (
    <h2 className={className}>
      {title} {accent && <span className="text-ember">{accent}</span>}
    </h2>
  )
}

// "2.5 kg" -> { pre: '', num: 2.5, dec: 1, post: ' kg' }. Sin número: se muestra tal cual.
function parseStat(stat = '') {
  const m = String(stat).match(/-?\d+(?:[.,]\d+)?/)
  if (!m) return { pre: stat, num: null, dec: 0, post: '' }
  const raw = m[0].replace(',', '.')
  return {
    pre: stat.slice(0, m.index),
    num: Number(raw),
    dec: raw.includes('.') ? raw.split('.')[1].length : 0,
    post: stat.slice(m.index + m[0].length),
  }
}

function Stat({ stat, label, big = false }) {
  if (!stat) return null
  const s = parseStat(stat)
  return (
    <div>
      <p className={`tnum font-display leading-none font-black text-gold ${big ? 'text-[clamp(4rem,7vw,6.5rem)]' : 'text-6xl'}`}>
        {s.pre}
        {s.num !== null ? (
          <span data-num data-to={s.num} data-dec={s.dec}>
            {s.num.toFixed(s.dec)}
          </span>
        ) : null}
        {s.post}
      </p>
      {label && <p className="mt-1 text-sm font-medium tracking-wide text-cream/80">{label}</p>}
    </div>
  )
}

// Cuenta un [data-num] desde 0 hasta su valor. Devuelve el tween (sirve dentro de timelines con scrub).
function countTween(el, opts = {}) {
  if (!el) return null
  const to = Number(el.dataset.to)
  const dec = Number(el.dataset.dec)
  const proxy = { v: 0 }
  return gsap.fromTo(
    proxy,
    { v: 0 },
    {
      v: to,
      ease: 'power2.out',
      duration: 1,
      ...opts,
      onUpdate: () => (el.textContent = proxy.v.toFixed(dec)),
    },
  )
}

export default function Process() {
  const { config } = useStore()
  const p = config.process || {}
  const steps = (p.steps || []).filter((s) => s.title || s.text)
  const root = useRef(null)
  const key = JSON.stringify(steps.map((s) => [s.title, s.image, s.stat]))

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      // Escritorio con movimiento: escena fijada (pin + scrub). Cada paso: recorte de foto,
      // texto que entra, contador que sube y la luz de las brasas que se intensifica.
      mm.add(`${MQ.motion} and ${MQ.desktop}`, () => {
        const stepEls = gsap.utils.toArray('[data-step]')
        const pics = gsap.utils.toArray('[data-pic]')
        const stats = gsap.utils.toArray('[data-stat]')
        const n = stepEls.length
        if (!n) return

        gsap.set(stepEls.slice(1), { autoAlpha: 0, y: 60 })
        gsap.set(stats.slice(1), { autoAlpha: 0, y: 30 })
        gsap.set(pics.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' })
        gsap.set('[data-heat]', { scaleY: n > 1 ? 1 / n : 1 })
        gsap.set('[data-ambient]', { opacity: 0.12, filter: 'brightness(0.55) saturate(0.8)' })

        // El primer contador cuenta al entrar la sección.
        countTween(stats[0]?.querySelector('[data-num]'), {
          duration: 1.4,
          scrollTrigger: { trigger: '[data-pin]', start: 'top 65%', toggleActions: 'play none none reverse' },
        })
        if (n < 2) return

        const tl = gsap.timeline({
          defaults: { ease: 'power2.inOut', duration: 1 },
          scrollTrigger: {
            trigger: '[data-pin]',
            start: 'top top',
            // Recorrido más corto (antes n × 100% con snap): la escena acompaña el scroll sin retenerlo.
            end: `+=${n * 70}%`,
            pin: true,
            scrub: 0.8,
          },
        })
        tl.addLabel('s0')
        for (let i = 1; i < n; i++) {
          const at = `s${i - 1}+=0.15`
          const light = i / (n - 1) // 0 → 1: de brasa tenue a brasa viva
          tl.to(stepEls[i - 1], { autoAlpha: 0, y: -60 }, at)
            .to(stats[i - 1], { autoAlpha: 0, y: -30 }, at)
            .to(stepEls[i], { autoAlpha: 1, y: 0 }, `${at}+=0.25`)
            .to(stats[i], { autoAlpha: 1, y: 0 }, `${at}+=0.3`)
            .to(pics[i], { clipPath: 'inset(0% 0% 0% 0%)', ease: 'expo.inOut', duration: 1.1 }, at)
            .fromTo(pics[i].querySelector('img, div'), { scale: 1.25 }, { scale: 1, duration: 1.3, ease: 'power3.out' }, at)
            .to('[data-heat]', { scaleY: (i + 1) / n, ease: 'none' }, at)
            .to(
              '[data-ambient]',
              { opacity: 0.12 + light * 0.38, filter: `brightness(${0.55 + light * 0.75}) saturate(${0.8 + light * 0.6})` },
              at,
            )
            .to('[data-proc-glow]', { opacity: 0.45 + light * 0.55, scale: 1 + light * 0.25 }, at)
            .to(`[data-dot="${i}"]`, { backgroundColor: '#EA580C', scale: 1.3, duration: 0.3 }, `${at}+=0.5`)
          const num = stats[i]?.querySelector('[data-num]')
          if (num) tl.add(countTween(num, { duration: 0.9, ease: 'power1.out' }), `${at}+=0.3`)
          tl.addLabel(`s${i}`, `s${i - 1}+=1.6`)
        }
        // Un respiro al final antes de soltar el pin.
        tl.to({}, { duration: 0.4 })
      })

      // Móvil con movimiento: sin pin; cada paso aparece y su cifra cuenta al llegar.
      mm.add(`${MQ.motion} and (max-width: 767px)`, () => {
        gsap.utils.toArray('[data-step-m]').forEach((el) => {
          gsap.from(el, { y: 40, opacity: 0, duration: 0.9, scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
          countTween(el.querySelector('[data-num]'), {
            duration: 1.3,
            scrollTrigger: { trigger: el, start: 'top 80%', once: true },
          })
        })
      })
      return () => mm.revert()
    },
    { scope: root, dependencies: [key], revertOnUpdate: true },
  )

  if (!steps.length) return null
  const label = `${p.title || ''} ${p.accent || ''}`.trim()

  return (
    <section ref={root} id="secreto" aria-label={label} className="grain relative isolate overflow-hidden bg-carbon">
      {/* Escritorio: escena fijada */}
      <div data-pin className="relative hidden h-[100svh] min-h-[660px] items-center overflow-hidden md:flex md:motion-reduce:hidden">
        {p.ambient_image && (
          <img
            data-ambient
            src={assetUrl(p.ambient_image)}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 -z-10 size-full scale-110 object-cover opacity-20 blur-[2px]"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-carbon via-carbon/85 to-carbon/40" aria-hidden="true" />
        <div
          data-proc-glow
          aria-hidden="true"
          className="absolute right-[-10%] bottom-[-30%] -z-10 size-[60rem] rounded-full bg-[radial-gradient(closest-side,rgb(234_88_12/0.45),transparent)] opacity-50"
        />

        <div className="wrap grid grid-cols-12 items-center gap-10">
          <div className="col-span-5">
            <Title title={p.title} accent={p.accent} className="display text-[clamp(3.4rem,6vw,6rem)]" />

            <div className="mt-10 flex gap-6">
              <div className="relative w-2 shrink-0 overflow-hidden rounded-full bg-cream/10" aria-hidden="true">
                <div data-heat className="absolute inset-0 origin-bottom rounded-full bg-gradient-to-t from-ember-deep via-ember to-gold" />
              </div>
              <div className="relative min-h-60 flex-1">
                {steps.map((s, i) => (
                  <div key={i} data-step className="absolute inset-0">
                    <p className="tnum font-display text-2xl font-black text-ember">
                      {String(i + 1).padStart(2, '0')} <span className="text-cream/60">/ {String(steps.length).padStart(2, '0')}</span>
                    </p>
                    <h3 className="mt-3 font-display text-[2.6rem] leading-none font-extrabold">{s.title}</h3>
                    <p className="mt-4 max-w-md text-lg leading-relaxed text-ash">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
            {steps.length > 1 && (
              <div className="mt-8 flex gap-2.5 pl-8" aria-hidden="true">
                {steps.map((_, i) => (
                  <span key={i} data-dot={i} className={`size-2.5 rounded-full ${i === 0 ? 'bg-ember' : 'bg-cream/20'}`} />
                ))}
              </div>
            )}
          </div>

          <div className="relative col-span-7">
            <div className="relative aspect-[16/11] overflow-hidden rounded-[2rem] shadow-[0_50px_140px_-40px_rgb(234_88_12/0.7)] ring-1 ring-cream/10">
              {steps.map((s, i) => (
                <div key={i} data-pic className="absolute inset-0 overflow-hidden">
                  {s.image ? (
                    <img src={assetUrl(s.image)} alt="" loading="lazy" className="size-full object-cover" />
                  ) : (
                    <div className="size-full bg-carbon-2" />
                  )}
                </div>
              ))}
              <div className="ember-light" aria-hidden="true" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-carbon/85 via-carbon/10 to-transparent" aria-hidden="true" />
              {/* Contadores sobre la foto */}
              <div className="absolute bottom-0 left-0 p-7 lg:p-9">
                <div className="relative">
                  {steps.map((s, i) => (
                    <div key={i} data-stat className={i === 0 ? 'relative' : 'absolute bottom-0 left-0'}>
                      <Stat stat={s.stat} label={s.stat_label} big />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Móvil y movimiento reducido: lista con foto y cifra */}
      <div className="wrap relative py-20 md:hidden md:motion-reduce:block">
        <Title title={p.title} accent={p.accent} className="display text-[clamp(3rem,14vw,4.5rem)]" />
        <ol className="mt-10 space-y-14 md:grid md:grid-cols-3 md:gap-8 md:space-y-0">
          {steps.map((s, i) => (
            <li key={i} data-step-m>
              {s.image && (
                <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-3xl ring-1 ring-cream/10">
                  <img src={assetUrl(s.image)} alt="" loading="lazy" className="size-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-carbon/80 to-transparent" aria-hidden="true" />
                  <div className="absolute bottom-0 left-0 p-5">
                    <Stat stat={s.stat} label={s.stat_label} />
                  </div>
                </div>
              )}
              <div className="border-l-2 border-ember pl-5">
                <p className="tnum font-display text-2xl font-black text-ember">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="mt-1 font-display text-3xl leading-none font-extrabold">{s.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-ash">{s.text}</p>
                {!s.image && s.stat && (
                  <div className="mt-4">
                    <Stat stat={s.stat} label={s.stat_label} />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
