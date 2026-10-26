import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Plus, Search } from 'lucide-react'
import { CATEGORY, ProductThumb } from '@/components/product-thumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useCart } from '@/context/cart'
import { api, formatBRL } from '@/lib/api'
import type { Category, Product } from '@/types'

const CATEGORIES = Object.keys(CATEGORY) as Category[]

export function CatalogPage() {
  const [products, setProducts] = useState<Product[] | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | 'todas'>('todas')

  useEffect(() => {
    api.listProducts().then(setProducts)
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (products ?? []).filter(
      (p) =>
        (category === 'todas' || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)),
    )
  }, [products, query, category])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Catálogo</h1>
          <p className="text-sm text-muted-foreground">
            {products ? `${visible.length} de ${products.length} produtos` : 'Carregando produtos…'}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos"
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={category === 'todas' ? 'default' : 'outline'}
          onClick={() => setCategory('todas')}
        >
          Todas
        </Button>
        {CATEGORIES.map((c) => (
          <Button key={c} size="sm" variant={category === c ? 'default' : 'outline'} onClick={() => setCategory(c)}>
            {CATEGORY[c].label}
          </Button>
        ))}
      </div>

      {!products ? (
        <ProductGridSkeleton />
      ) : visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const { cart, add, busy } = useCart()
  const inCart = cart.items.find((i) => i.product.id === product.id)?.quantity ?? 0
  const soldOut = product.stock === 0
  const limitReached = inCart >= product.stock

  return (
    <Card
      className="enter gap-0 overflow-hidden py-0 transition-[box-shadow] duration-200 hover:shadow-md"
      style={{ '--i': index } as CSSProperties}
    >
      <ProductThumb category={product.category} className="aspect-[4/3] rounded-none" />
      <CardContent className="flex flex-1 flex-col gap-1.5 pt-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{CATEGORY[product.category].label}</Badge>
          {soldOut ? (
            <Badge variant="destructive">Esgotado</Badge>
          ) : product.stock < 10 ? (
            <span className="text-xs text-muted-foreground">Restam {product.stock}</span>
          ) : null}
        </div>
        <h3 className="font-medium leading-snug">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
      </CardContent>
      <CardFooter className="mt-auto items-center justify-between pt-3 pb-4">
        <span className="text-lg font-semibold tabular-nums">{formatBRL(product.price_cents)}</span>
        <Button size="sm" variant={inCart ? 'secondary' : 'default'} disabled={soldOut || limitReached || busy} onClick={() => add(product)}>
          <Plus />
          {inCart ? `No carrinho (${inCart})` : 'Adicionar'}
        </Button>
      </CardFooter>
    </Card>
  )
}

function ProductGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border">
          <div className="aspect-[4/3] animate-pulse bg-muted" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
