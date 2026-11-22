import { useEffect, useRef } from 'react'
import { useCart } from '../context/CartContext'
import { useStore } from '../context/StoreContext'
import { gsap, prefersReduced, ScrollTrigger } from '../lib/gsap'
import { assetUrl } from '../utils/format'
import AnimatedPrice from '../components/AnimatedPrice'
import Header, { AnnouncementBar } from '../components/Header'
import Hero from '../components/Hero'
import Menu from '../components/Menu'
import Process from '../components/Process'
import Marquee from '../components/Marquee'
import Visit from '../components/Visit'
import Footer from '../components/Footer'
import CartDrawer from '../components/CartDrawer'
import { IconBag } from '../components/Icons'

// Barra fija de pedido en móvil: sube desde abajo al primer producto y "late" con cada agregado.
function MobileCartBar() {
  const { count, total, setOpen } = useCart()
  const bar = useRef(null)
  const shown = count > 0

  useEffect(() => {
    if (!shown || !bar.current || prefersReduced()) return
    gsap.fromTo(bar.current, { yPercent: 130 }, { yPercent: 0, duration: 0.7, ease: 'expo.out' })
  }, [shown])

  useEffect(() => {
    const onPop = () => {
      if (!bar.current || prefersReduced()) return
      gsap.fromTo(bar.current.querySelector('button'), { scale: 1.04 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' })
    }
    window.addEventListener('pc:cart-pop', onPop)
    return () => window.removeEventListener('pc:cart-pop', onPop)
  }, [])

  if (!shown) return null
  return (
    <div ref={bar} className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <button
        type="button"
        data-cart-target-mobile
        onClick={() => setOpen(true)}
        className="btn btn-ember w-full justify-between text-base shadow-[0_12px_40px_-8px_rgb(234_88_12/0.7)]"
      >
        <span className="inline-flex items-center gap-2">
          <IconBag /> Ver pedido ({count})
        </span>
        <AnimatedPrice value={total} />
      </button>
    </div>
  )
}

export default function Home() {
  const { loading, config } = useStore()

  // SEO y favicon desde el admin.
  useEffect(() => {
    if (config.seo?.title) document.title = config.seo.title
    const desc = document.querySelector('meta[name="description"]')
    if (desc && config.seo?.description) desc.setAttribute('content', config.seo.description)
    const icon = document.querySelector('link[rel="icon"]')
    if (icon) {
      const href = config.brand?.logo_url ? assetUrl(config.brand.logo_url) : assetUrl('favicon.svg')
      icon.setAttribute('href', href)
      icon.removeAttribute('type')
    }
  }, [config.seo, config.brand?.logo_url])

  // Recalcular disparadores cuando terminan de cargar fuentes y datos (cambian alturas).
  useEffect(() => {
    if (loading) return
    const r = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(r)
    window.addEventListener('load', r)
    return () => window.removeEventListener('load', r)
  }, [loading])

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main>
        <Hero />
        <Menu />
        <Marquee />
        <Process />
        <Visit />
      </main>
      <Footer />
      <MobileCartBar />
      <CartDrawer />
    </>
  )
}
