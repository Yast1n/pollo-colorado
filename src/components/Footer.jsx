import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { Logo } from './Header'

const SOCIAL_LABELS = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok' }

export default function Footer() {
  const { config } = useStore()
  const socials = Object.entries(config.socials || {}).filter(([, url]) => url?.trim())
  return (
    <footer className="bg-carbon pt-16 pb-28 text-ash md:pb-12">
      <div className="wrap flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm">Pollos asados a las brasas en {config.address || 'Pirque'}.</p>
        </div>
        <nav aria-label="Redes y enlaces" className="flex flex-wrap gap-x-6 gap-y-3 text-[15px]">
          {socials.map(([k, url]) => (
            <a key={k} href={url} target="_blank" rel="noopener noreferrer" className="hover:text-cream">
              {SOCIAL_LABELS[k] || k}
            </a>
          ))}
          <a href="#menu" className="hover:text-cream">Menú</a>
          <a href="#visitanos" className="hover:text-cream">Horarios</a>
          <Link to="/admin" className="hover:text-cream">Acceso dueños</Link>
        </nav>
      </div>
      <p className="wrap mt-12 border-t border-cream/10 pt-6 text-sm text-ash/80">
        © {new Date().getFullYear()} Pollo Colorado. Imágenes ilustrativas; los productos pueden variar.
      </p>
    </footer>
  )
}
