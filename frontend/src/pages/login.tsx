import { useState, type FormEvent } from 'react'
import { Loader2, ShoppingCart } from 'lucide-react'
import { Navigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/auth'
import { USE_MOCK } from '@/lib/api'

export function LoginPage() {
  const { session, login } = useAuth()
  const [email, setEmail] = useState(USE_MOCK ? 'demo@rustcart.dev' : '')
  const [password, setPassword] = useState(USE_MOCK ? 'demo1234' : '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/catalogo" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <div className="enter w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm">
            <ShoppingCart className="size-5" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Rust Cart</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Use seu e-mail e senha para acessar o catálogo.</CardDescription>
          </CardHeader>
          <form onSubmit={onSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="mt-6 flex-col gap-3">
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="spin-fast" />}
                Entrar
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  )
}
