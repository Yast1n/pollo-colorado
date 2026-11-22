import { useRef } from 'react'
import { useStore } from '../context/StoreContext'
import { gsap, useGSAP, MQ } from '../lib/gsap'
import { chileNow, dayPhrase, groupHours, openState, scheduleDriven } from '../utils/hours'
import { mapsLinks, whatsappLink } from '../utils/whatsapp'
import StatusBadge, { useStoreStatus } from './StatusBadge'
import { IconClock, IconPin, IconWhatsApp } from './Icons'

export default function Visit() {
  const { config } = useStore()
  const v = config.visit || {}
  const root = useRef(null)
  const rows = groupHours(config.hours)
  const status = useStoreStatus()
  const now = chileNow()
  const os = openState(config.hours, now)
  // Línea de horario en vivo (solo si no contradice al estado: "Agotado" o "Cerrado" mandan).
  const liveLine =
    status === 'open' && os.open
      ? `Cierra hoy a las ${os.closes}`
      : (status === 'scheduling' || (status === 'closed' && scheduleDriven(config, now))) && !os.open && os.opens
        ? `Abre ${dayPhrase(os.day)} a las ${os.opens}`
        : null
  const maps = mapsLinks(config.maps_query || config.address)

  // Momento tipográfico: "PIRQUE" se desliza con el scroll (texto decorativo, no información).
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MQ.motion, () => {
        gsap.fromTo(
          '[data-bigword]',
          { xPercent: 8 },
          {
            xPercent: -12,
            ease: 'none',
            scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        )
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section ref={root} id="visitanos" aria-labelledby="visit-title" className="relative overflow-hidden bg-cream py-20 text-carbon sm:py-28">
      <p
        data-bigword
        aria-hidden="true"
        className="display pointer-events-none absolute top-6 left-0 text-[clamp(8rem,28vw,24rem)] whitespace-nowrap text-transparent select-none [-webkit-text-stroke:2px_rgb(194_65_12/0.18)]"
      >
        {v.big_word} {v.big_word}
      </p>

      <div className="wrap relative grid gap-12 pt-[clamp(4rem,14vw,12rem)] lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 id="visit-title" className="display text-[clamp(3rem,7.5vw,6rem)]">
            {v.title}
          </h2>
          <p className="mt-5 max-w-md text-lg text-ink-soft">
            {v.intro} {config.delivery_note}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex rounded-full bg-carbon">
              <StatusBadge status={status} showHint={false} />
            </span>
            {liveLine && <span className="tnum text-[15px] font-semibold text-ink-soft">{liveLine}</span>}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:col-span-7">
          <div className="rounded-2xl bg-white p-6 shadow-[0_18px_40px_-30px_rgb(18_15_13/0.5)] sm:p-7">
            <h3 className="flex items-center gap-2 font-display text-3xl font-extrabold">
              <IconClock className="text-ember" /> {v.hours_title}
            </h3>
            <dl className="mt-5 divide-y divide-carbon/10">
              {rows.map((r) => {
                const isToday = r.idx.includes(now.getDay())
                return (
                  <div key={r.days} className="flex items-baseline justify-between gap-4 py-3">
                    <dt className={isToday ? 'font-semibold text-carbon' : 'text-ink-soft'}>
                      {r.days}
                      {isToday && <span className="ml-2 rounded-full bg-ember-deep px-2 py-0.5 text-xs font-bold text-white">Hoy</span>}
                    </dt>
                    <dd className={`tnum ${r.text === 'Cerrado' ? 'text-ink-soft' : 'font-semibold'}`}>{r.text}</dd>
                  </div>
                )
              })}
            </dl>
          </div>

          <div className="flex flex-col rounded-2xl bg-carbon p-6 text-cream shadow-[0_24px_50px_-30px_rgb(18_15_13/0.8)] sm:p-7">
            <h3 className="flex items-center gap-2 font-display text-3xl font-extrabold">
              <IconPin className="text-gold" /> {v.where_title}
            </h3>
            <p className="mt-5 text-xl font-semibold">{config.address}</p>
            <p className="mt-2 flex-1 text-ash">{v.where_text}</p>
            <div className="mt-6 grid gap-2.5">
              <a href={maps.google} target="_blank" rel="noopener noreferrer" className="btn btn-ember">
                {v.btn_maps}
              </a>
              <a href={maps.waze} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                {v.btn_waze}
              </a>
              <a
                href={whatsappLink(config.whatsapp, config.greeting)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
              >
                <IconWhatsApp className="text-[#25D366]" /> {v.btn_whatsapp}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
