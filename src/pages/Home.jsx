import { useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { useStore } from '../context/StoreContext'
import { ScrollTrigger } from '../lib/gsap'
import { formatCLP } from '../utils/format'
import Header, { AnnouncementBar } from '../components/Header'
import Hero from '../components/Hero'
import Menu from '../components/Menu'
import Process from '../components/Process'
import Visit from '../components/Visit'
import Footer from '../components/Footer'
import CartDrawer from '../components/CartDrawer'
import { IconBag } from '../components/Icons'

// Barra fija de pedido en móvil (aparece cuando hay productos).
function MobileCartBar() {
  const { count, total, setOpen } = useCart()
  if (!count) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-ember w-full justify-between text-base shadow-[0_12px_40px_-8px_rgb(234_88_12/0.7)]"
      >
        <span className="inline-flex items-center gap-2">
          <IconBag /> Ver pedido ({count})
        </span>
        <span className="tnum">{formatCLP(total)}</span>
      </button>
    </div>
  )
}

export default function Home() {
  const { loading } = useStore()

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
        <Process />
        <Visit />
      </main>
      <Footer />
      <MobileCartBar />
      <CartDrawer />
    </>
  )
}
