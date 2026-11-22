import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as store from '../services/storeService'
import { SEED_CONFIG } from '../data/seed'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [config, setConfig] = useState(SEED_CONFIG)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([store.getConfig(), store.getProducts()])
      setConfig(c)
      setProducts(p)
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
    return store.subscribe(reload)
  }, [reload])

  return (
    <StoreContext.Provider value={{ config, products, loading, error, reload, mode: store.mode }}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)
