import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as store from '../services/storeService'
import { useStore } from '../context/StoreContext'
import { Logo } from '../components/Header'
import OperationsTab from '../admin/OperationsTab'
import MenuTab from '../admin/MenuTab'
import BusinessTab from '../admin/BusinessTab'
import CustomizeTab from '../admin/CustomizeTab'
import { ToastProvider } from '../admin/Toast'
import { IconClock, IconExternal, IconFlame, IconList, IconLogout, IconSliders } from '../components/Icons'

function DemoNotice() {
  if (store.isRemote) return null
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-amber-100" role="note">
      <span className="mt-1 size-2 shrink-0 rounded-full bg-gold" />
      <p>
        <strong>Modo Demo Local</strong>: conecta Supabase para sincronizar en vivo. Los cambios solo se guardan en este
        navegador.
      </p>
    </div>
  )
}

function Login({ onDone }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await store.signIn(email, password)
      if (!(await store.isAdmin())) {
        await store.signOut()
        throw new Error('Tu cuenta no tiene permisos de administración. Agrégala a la tabla admin_users.')
      }
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const demo = async () => {
    await store.signIn('demo@pollocolorado.example', 'demo')
    onDone()
  }

  return (
    <main className="grain relative grid min-h-dvh place-items-center overflow-hidden px-4 py-12">
      <div aria-hidden="true" className="absolute inset-x-0 bottom-[-40%] h-[80%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(234_88_12/0.35),transparent)]" />
      <div className="relative w-full max-w-sm">
        <Logo className="justify-center" />
        <form onSubmit={submit} className="mt-8 rounded-3xl border border-cream/10 bg-carbon-2/80 p-6 backdrop-blur sm:p-8" noValidate>
          <h1 className="display text-4xl">Panel de dueños</h1>
          <p className="mt-2 text-sm text-ash">Ingresa con tu cuenta para administrar el local.</p>
          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" type="email" autoComplete="username" required className="field-dark" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label htmlFor="password" className="label">Contraseña</label>
              <input id="password" type="password" autoComplete="current-password" required className="field-dark" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          {error && <p role="alert" className="mt-4 text-sm font-semibold text-orange-300">{error}</p>}
          <button type="submit" disabled={busy} className="btn btn-ember mt-6 w-full disabled:opacity-60">
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
          {!store.isRemote && (
            <>
              <button type="button" onClick={demo} className="btn btn-ghost mt-3 w-full">
                Entrar en modo demo
              </button>
              <div className="mt-5"><DemoNotice /></div>
            </>
          )}
        </form>
        <p className="mt-6 text-center text-sm">
          <Link to="/" className="text-ash hover:text-cream">← Volver al sitio</Link>
        </p>
      </div>
    </main>
  )
}

const TABS = [
  { id: 'ops', label: 'Operación del día', short: 'Hoy', Icon: IconFlame },
  { id: 'menu', label: 'Menú', short: 'Menú', Icon: IconList },
  { id: 'business', label: 'Mi negocio', short: 'Negocio', Icon: IconClock },
  { id: 'customize', label: 'Personalizar', short: 'Textos', Icon: IconSliders },
]
const TAB_KEY = 'pc-admin-tab'

function Dashboard({ session, onLogout }) {
  // Recordamos la última pestaña: en el celular se vuelve al mismo lugar al abrir el acceso directo.
  const [tab, setTabState] = useState(() => {
    try {
      const t = localStorage.getItem(TAB_KEY)
      return TABS.some((x) => x.id === t) ? t : 'ops'
    } catch {
      return 'ops'
    }
  })
  const setTab = (id) => {
    setTabState(id)
    window.scrollTo({ top: 0 })
    try {
      localStorage.setItem(TAB_KEY, id)
    } catch {
      /* sin almacenamiento: no pasa nada */
    }
  }
  const { loading } = useStore()
  return (
    <div className="min-h-dvh bg-carbon pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-0">
      <header className="sticky top-0 z-30 border-b border-cream/10 bg-carbon/90 backdrop-blur">
        <div className="wrap flex h-14 items-center justify-between gap-3 sm:h-16">
          <Logo />
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/" className="btn btn-ghost min-h-10 px-3 text-sm sm:px-4" aria-label="Ver sitio">
              <IconExternal width="18" height="18" className="sm:hidden" />
              <span className="hidden sm:inline">Ver sitio</span>
            </Link>
            <button type="button" onClick={onLogout} className="btn min-h-10 px-3 text-sm text-ash hover:text-cream sm:px-4" aria-label="Salir">
              <IconLogout width="18" height="18" className="sm:hidden" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
        <nav className="wrap hidden gap-1 pb-2 sm:flex" role="tablist" aria-label="Secciones del panel">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors ${
                tab === t.id ? 'bg-cream text-carbon' : 'text-ash hover:bg-cream/10 hover:text-cream'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Celular: pestañas abajo, al alcance del pulgar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 [body:has([aria-modal=true])_&]:hidden border-t border-cream/10 bg-carbon/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
        role="tablist"
        aria-label="Secciones del panel"
      >
        {TABS.map(({ id, short, label, Icon }) => {
          const on = tab === id
          return (
            <button
              key={id}
              role="tab"
              aria-selected={on}
              aria-label={label}
              onClick={() => setTab(id)}
              className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors active:scale-95 ${
                on ? 'text-gold' : 'text-ash'
              }`}
            >
              <span className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${on ? 'bg-gold/15' : ''}`}>
                <Icon width="20" height="20" />
              </span>
              {short}
            </button>
          )
        })}
      </nav>

      <main className="wrap space-y-6 py-6 sm:py-8">
        <DemoNotice />
        {loading ? (
          <p className="text-ash">Cargando datos…</p>
        ) : (
          <>
            {tab === 'ops' && <OperationsTab />}
            {tab === 'menu' && <MenuTab />}
            {tab === 'business' && <BusinessTab />}
            {tab === 'customize' && <CustomizeTab />}
          </>
        )}
        <p className="pt-2 text-xs text-ash">Sesión: {session?.user?.email}</p>
      </main>
    </div>
  )
}

export default function Admin() {
  const [session, setSession] = useState(undefined)
  const [allowed, setAllowed] = useState(false)

  const check = useCallback(async () => {
    const s = await store.getSession()
    setAllowed(s ? await store.isAdmin() : false)
    setSession(s)
  }, [])

  useEffect(() => {
    document.title = 'Panel · Pollo Colorado'
    check()
    const off = store.onAuthChange(() => check())
    return () => {
      off()
      document.title = 'Pollo Colorado · Pollos asados a las brasas en Pirque'
    }
  }, [check])

  if (session === undefined) return <div className="grid min-h-dvh place-items-center text-ash">Cargando…</div>

  return (
    <ToastProvider>
      {session && allowed ? (
        <Dashboard
          session={session}
          onLogout={async () => {
            await store.signOut()
            check()
          }}
        />
      ) : (
        <Login onDone={check} />
      )}
    </ToastProvider>
  )
}
