import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { StoreProvider } from './context/StoreContext'
import { CartProvider } from './context/CartContext'
import Home from './pages/Home'

// El panel admin se carga aparte: el cliente público no descarga su código.
const Admin = lazy(() => import('./pages/Admin'))

export default function App() {
  return (
    <StoreProvider>
      <Routes>
        <Route
          path="/"
          element={
            <CartProvider>
              <Home />
            </CartProvider>
          }
        />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<div className="grid min-h-dvh place-items-center text-ash">Cargando panel…</div>}>
              <Admin />
            </Suspense>
          }
        />
        <Route path="*" element={<CartProvider><Home /></CartProvider>} />
      </Routes>
    </StoreProvider>
  )
}
