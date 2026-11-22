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
  { id: 'ops', label: 'Operación del día' },
  { id: 'menu', label: 'Menú' },
  { id: 'business', label: 'Mi negocio' },
  { id: 'customize', label: 'Personalizar' },
]

function Dashboard({ session, onLogout }) {
  const [tab, setTab] = useState('ops')
  const { loading } = useStore()
  return (
    <div className="min-h-dvh bg-carbon">
      <header className="sticky top-0 z-30 border-b border-cream/10 bg-carbon/90 backdrop-blur">
        <div className="wrap flex h-16 items-center justify-between gap-3">
          <Logo />
          <div className="flex items-center gap-2">
            <Link to="/" className="btn btn-ghost min-h-10 px-4 text-sm">Ver sitio</Link>
            <button type="button" onClick={onLogout} className="btn min-h-10 px-4 text-sm text-ash hover:text-cream">Salir</button>
          </div>
        </div>
        <nav className="wrap flex gap-1 overflow-x-auto pb-2 [scrollbar-width:none]" role="tablist" aria-label="Secciones del panel">
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
      <main className="wrap space-y-6 py-8">
        <DemoNotice />
        <p className="text-sm text-ash">Sesión: {session?.user?.email}</p>
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
