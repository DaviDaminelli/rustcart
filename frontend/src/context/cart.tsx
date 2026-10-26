import { createContext, use, useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth'
import { api } from '@/lib/api'
import type { Cart, Product } from '@/types'

interface CartContextValue {
  cart: Cart
  count: number
  busy: boolean
  add(product: Product): Promise<void>
  setQuantity(productId: number, quantity: number): Promise<void>
  remove(productId: number): Promise<void>
  clear(): Promise<void>
}

const EMPTY: Cart = { items: [], total_cents: 0 }
const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [loaded, setCart] = useState<Cart>(EMPTY)
  const [busy, setBusy] = useState(false)
  const token = session?.token
  const cart = token ? loaded : EMPTY

  useEffect(() => {
    if (!token) return
    api.getCart(token).then(setCart).catch(() => toast.error('Não foi possível carregar o carrinho'))
  }, [token])

  async function run(action: (token: string) => Promise<Cart>) {
    if (!token) return
    setBusy(true)
    try {
      setCart(await action(token))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setBusy(false)
    }
  }

  const value: CartContextValue = {
    cart,
    busy,
    count: cart.items.reduce((n, i) => n + i.quantity, 0),
    add: async (product) => {
      await run((t) => api.addItem(t, product.id, 1))
      toast.success(`${product.name} adicionado ao carrinho`)
    },
    setQuantity: (id, qty) => run((t) => api.updateItem(t, id, qty)),
    remove: (id) => run((t) => api.removeItem(t, id)),
    clear: () => run((t) => api.clearCart(t)),
  }

  return <CartContext value={value}>{children}</CartContext>
}

export function useCart() {
  const ctx = use(CartContext)
  if (!ctx) throw new Error('useCart precisa estar dentro de <CartProvider>')
  return ctx
}
