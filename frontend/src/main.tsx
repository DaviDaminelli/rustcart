import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/context/auth'
import { CartProvider } from '@/context/cart'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <App />
        {/* App só tem tema claro; "system" deixava a descrição cinza-clara em SO com dark mode */}
        <Toaster position="bottom-right" theme="light" richColors />
      </CartProvider>
    </AuthProvider>
  </StrictMode>,
)
