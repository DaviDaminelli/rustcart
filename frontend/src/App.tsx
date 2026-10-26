import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router'
import { AppHeader } from '@/components/app-header'
import { useAuth } from '@/context/auth'
import { CartPage } from '@/pages/cart'
import { CatalogPage } from '@/pages/catalog'
import { LoginPage } from '@/pages/login'

function ProtectedLayout() {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />

  return (
    <div className="min-h-svh">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/catalogo" element={<CatalogPage />} />
          <Route path="/carrinho" element={<CartPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/catalogo" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
