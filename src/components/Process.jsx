import { useRef } from 'react'
import { gsap, useGSAP, MQ } from '../lib/gsap'
import { assetUrl } from '../utils/format'

// Es un proceso real en orden, por eso va numerado.
const STEPS = [
  {
    title: 'Adobo la noche anterior',
    text: 'Ajo, comino, merkén suave y sal de mar. Cada pollo reposa en frío toda la noche para que el sabor llegue al hueso.',
    img: 'images/productos/cuarto-pollo.svg',
  },
  {
    title: 'Calibre parejo de 2.4 a 2.5 kg',
    text: 'Elegimos pollos del mismo tamaño para que todos se cocinen igual: jugosos por dentro y sin partes secas.',
    img: 'images/productos/medio-pollo.svg',
  },
  {
    title: 'Carbón, nunca gas',
    text: 'Brasa de carbón vegetal y fuego lento. El pollo gira hasta que la grasa se funde y la piel se vuelve crocante.',
    img: 'images/productos/pollo-entero.svg',
  },
  {
    title: 'Sale solo cuando está dorado',
    text: 'Lo sacamos cuando la piel cruje y el jugo corre claro. Si todavía no está listo, espera un poco más en las brasas.',
    img: 'images/productos/combo-familiar.svg',
  },
]

export default function Process() {
  const root = useRef(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      // Escritorio con movimiento: sección fijada; el scroll "enciende" el medidor y avanza los pasos.
      mm.add(`${MQ.motion} and ${MQ.desktop}`, () => {
        const steps = gsap.utils.toArray('[data-step]')
        const pics = gsap.utils.toArray('[data-pic]')
        gsap.set(steps.slice(1), { opacity: 0, y: 50 })
        gsap.set(pics.slice(1), { opacity: 0, scale: 1.08 })
        gsap.set('[data-heat]', { scaleY: 0 })

        const tl = gsap.timeline({
          defaults: { ease: 'power2.inOut', duration: 1 },
          scrollTrigger: {
            trigger: '[data-pin]',
            start: 'top top',
            end: `+=${STEPS.length * 85}%`,
            pin: true,
            scrub: 0.8,
            snap: { snapTo: 'labels', duration: { min: 0.2, max: 0.6 }, ease: 'power1.inOut' },
          },
        })
        tl.addLabel('s0')
        tl.to('[data-heat]', { scaleY: 1, ease: 'none', duration: STEPS.length - 1 }, 0)
        for (let i = 1; i < STEPS.length; i++) {
          const at = i - 1
          tl.to(steps[i - 1], { opacity: 0, y: -50 }, at)
            .to(steps[i], { opacity: 1, y: 0 }, at + 0.15)
            .to(pics[i - 1], { opacity: 0, scale: 0.96 }, at)
            .to(pics[i], { opacity: 1, scale: 1 }, at)
            .to(`[data-dot="${i}"]`, { backgroundColor: '#EA580C', scale: 1.25, duration: 0.3 }, at + 0.4)
            .addLabel(`s${i}`, at + 1)
        }
        // Parallax suave del resplandor de fondo.
        gsap.fromTo('[data-proc-glow]', { yPercent: -10 }, {
          yPercent: 10,
          ease: 'none',
          scrollTrigger: { trigger: '[data-pin]', start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })

      // Móvil con movimiento: sin fijar; cada paso aparece al llegar.
      mm.add(`${MQ.motion} and (max-width: 767px)`, () => {
        gsap.utils.toArray('[data-step-m]').forEach((el) =>
          gsap.from(el, { y: 40, opacity: 0, duration: 0.9, scrollTrigger: { trigger: el, start: 'top 88%', once: true } }),
        )
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section ref={root} id="secreto" aria-label="El secreto de nuestras brasas" className="grain relative overflow-hidden bg-carbon">
      <div
        data-proc-glow
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -z-0 size-[70rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(194_65_12/0.28),transparent)]"
      />

      {/* Escritorio: escena fijada */}
      <div data-pin className="relative hidden h-[100svh] min-h-[640px] items-center md:flex md:motion-reduce:hidden">
        <div className="wrap grid grid-cols-12 items-center gap-10">
          <div className="col-span-5">
            <h2 className="display text-[clamp(3.4rem,6.5vw,6.2rem)]">
              El secreto de nuestras <span className="text-ember">brasas</span>
            </h2>

            <div className="mt-10 flex gap-6">
              {/* Medidor de calor */}
              <div className="relative w-2 shrink-0 overflow-hidden rounded-full bg-cream/10" aria-hidden="true">
                <div
                  data-heat
                  className="absolute inset-0 origin-bottom rounded-full bg-gradient-to-t from-ember-deep via-ember to-gold"
                />
              </div>
              <div className="relative min-h-56 flex-1">
                {STEPS.map((s, i) => (
                  <div key={i} data-step className="absolute inset-0">
                    <p className="tnum font-display text-6xl font-black text-gold">{String(i + 1).padStart(2, '0')}</p>
                    <h3 className="mt-2 font-display text-4xl leading-none font-extrabold">{s.title}</h3>
                    <p className="mt-4 max-w-md text-lg leading-relaxed text-ash">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 flex gap-2.5 pl-8" aria-hidden="true">
              {STEPS.map((_, i) => (
                <span key={i} data-dot={i} className={`size-2.5 rounded-full ${i === 0 ? 'bg-ember' : 'bg-cream/20'}`} />
              ))}
            </div>
          </div>

          <div className="relative col-span-7 aspect-[4/3]">
            {STEPS.map((s, i) => (
              <img
                key={i}
                data-pic
                src={assetUrl(s.img)}
                alt=""
                loading="lazy"
                width="800"
                height="600"
                className="absolute inset-0 size-full rounded-[2rem] object-cover shadow-[0_40px_120px_-40px_rgb(234_88_12/0.6)]"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Móvil y movimiento reducido: lista simple */}
      <div className="wrap relative py-20 md:hidden md:motion-reduce:block">
        <h2 className="display text-[clamp(3rem,14vw,4.5rem)]">
          El secreto de nuestras <span className="text-ember">brasas</span>
        </h2>
        <ol className="mt-10 space-y-12">
          {STEPS.map((s, i) => (
            <li key={i} data-step-m className="border-l-2 border-ember pl-5">
              <p className="tnum font-display text-5xl font-black text-gold">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="mt-1 font-display text-3xl leading-none font-extrabold">{s.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-ash">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
