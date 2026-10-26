import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: {
    // Em modo real (VITE_USE_MOCK=false) as chamadas /api vão para o Actix
    proxy: { '/api': 'http://127.0.0.1:8080' },
  },
})
