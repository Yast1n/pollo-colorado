import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' => rutas relativas: funciona en https://usuario.github.io/<repo>/ sin configurar nada.
// Con HashRouter, /#/admin nunca da 404 al recargar en GitHub Pages.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@supabase')) return 'supabase'
          if (id.includes('node_modules/gsap')) return 'gsap'
        },
      },
    },
  },
})
