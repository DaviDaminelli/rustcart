import { LogOut, ShoppingCart, Store } from 'lucide-react'
import { NavLink } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth'
import { useCart } from '@/context/cart'
import { cn } from '@/lib/utils'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
  )

export function AppHeader() {
  const { session, logout } = useAuth()
  const { count } = useCart()

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
        <div className="flex items-center gap-2 font-semibold">
          <span className="flex size-7 items-center justify-center rounded-md bg-orange-600 text-white">
            <ShoppingCart className="size-4" />
          </span>
          Rust Cart
        </div>

        <nav className="flex items-center gap-1">
          <NavLink to="/catalogo" className={linkClass}>
            <Store className="size-4" /> Catálogo
          </NavLink>
          <NavLink to="/carrinho" className={linkClass}>
            <ShoppingCart className="size-4" /> Carrinho
            {count > 0 && <Badge className="h-5 min-w-5 px-1.5 tabular-nums">{count}</Badge>}
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="text-right text-sm leading-tight">
            <div className="font-medium">{session?.user.name}</div>
            <div className="text-xs text-muted-foreground">{session?.user.email}</div>
          </div>
          <Button variant="outline" size="icon" aria-label="Sair" onClick={logout}>
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  )
}
