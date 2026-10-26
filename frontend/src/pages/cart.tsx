import { useState, type CSSProperties } from 'react'
import { Loader2, ShoppingCart, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { CATEGORY, ProductThumb } from '@/components/product-thumb'
import { QuantityStepper } from '@/components/quantity-stepper'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/context/cart'
import { formatBRL } from '@/lib/api'

export function CartPage() {
  const { cart, count, busy, setQuantity, remove, clear } = useCart()
  const [checkingOut, setCheckingOut] = useState(false)

  async function checkout() {
    setCheckingOut(true)
    await clear()
    setCheckingOut(false)
    toast.success('Pedido realizado!', { description: 'Você receberá a confirmação por e-mail.' })
  }

  if (cart.items.length === 0) {
    return (
      <div className="enter flex flex-col items-center gap-3 py-24 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShoppingCart className="size-5" />
        </span>
        <h1 className="text-lg font-semibold">Seu carrinho está vazio</h1>
        <p className="text-sm text-muted-foreground">Escolha alguns itens no catálogo.</p>
        <Button asChild className="mt-2">
          <Link to="/catalogo">Ver catálogo</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Carrinho</h1>
        <p className="text-sm text-muted-foreground">
          {count} {count === 1 ? 'item' : 'itens'}
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="py-0">
          <ul className="divide-y">
            {cart.items.map(({ product, quantity }, i) => (
              <li
                key={product.id}
                className="enter flex items-center gap-4 p-4"
                style={{ '--i': i } as CSSProperties}
              >
                <ProductThumb category={product.category} className="size-16 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {CATEGORY[product.category].label} · {formatBRL(product.price_cents)} un.
                  </p>
                </div>
                <QuantityStepper
                  value={quantity}
                  max={product.stock}
                  disabled={busy}
                  onChange={(q) => setQuantity(product.id, q)}
                />
                <span className="w-24 text-right font-medium tabular-nums">
                  {formatBRL(product.price_cents * quantity)}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remover ${product.name}`}
                  disabled={busy}
                  onClick={() => remove(product.id)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="enter lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Subtotal" value={formatBRL(cart.total_cents)} />
            <Row label="Frete" value="Grátis" />
            <Separator />
            <div className="flex items-baseline justify-between">
              <span className="font-medium">Total</span>
              <span className="text-xl font-semibold tabular-nums">{formatBRL(cart.total_cents)}</span>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button className="w-full" size="lg" disabled={busy} onClick={checkout}>
              {checkingOut && <Loader2 className="spin-fast" />}
              Finalizar compra
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/catalogo">Continuar comprando</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}
