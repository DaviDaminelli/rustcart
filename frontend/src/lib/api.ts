import { mockInitialCart, mockProducts, mockUser } from '@/mocks/data'
import type { Cart, LoginResponse, Product } from '@/types'

/**
 * Mock ligado por padrão (para rodar sem API/banco).
 * Para usar o Actix de verdade: VITE_USE_MOCK=false no .env.
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const API_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export interface Api {
  login(email: string, password: string): Promise<LoginResponse>
  listProducts(): Promise<Product[]>
  getCart(token: string): Promise<Cart>
  addItem(token: string, productId: number, quantity: number): Promise<Cart>
  updateItem(token: string, productId: number, quantity: number): Promise<Cart>
  removeItem(token: string, productId: number): Promise<Cart>
  clearCart(token: string): Promise<Cart>
}

// ---------------------------------------------------------------- HTTP (Actix)

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.error ?? res.statusText)
  }
  return res.json() as Promise<T>
}

const httpApi: Api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  listProducts: () => request('/products'),
  getCart: (token) => request('/cart', {}, token),
  addItem: (token, product_id, quantity) =>
    request('/cart/items', { method: 'POST', body: JSON.stringify({ product_id, quantity }) }, token),
  updateItem: (token, productId, quantity) =>
    request(`/cart/items/${productId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }, token),
  removeItem: (token, productId) => request(`/cart/items/${productId}`, { method: 'DELETE' }, token),
  clearCart: (token) => request('/cart', { method: 'DELETE' }, token),
}

// ---------------------------------------------------------------- Mock (memória)

const cartState = new Map<number, number>(mockInitialCart.map((i) => [i.product_id, i.quantity]))
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))

function snapshot(): Cart {
  const items = [...cartState.entries()].flatMap(([id, quantity]) => {
    const product = mockProducts.find((p) => p.id === id)
    return product ? [{ product, quantity }] : []
  })
  const total_cents = items.reduce((sum, i) => sum + i.product.price_cents * i.quantity, 0)
  return { items, total_cents }
}

const mockApi: Api = {
  async login(email, password) {
    await delay(500)
    if (!email || password.length < 4) throw new ApiError(401, 'E-mail ou senha inválidos')
    return { token: 'mock-token', user: { ...mockUser, email } }
  },
  async listProducts() {
    await delay()
    return mockProducts
  },
  async getCart() {
    await delay(100)
    return snapshot()
  },
  async addItem(_t, productId, quantity) {
    await delay(150)
    cartState.set(productId, (cartState.get(productId) ?? 0) + quantity)
    return snapshot()
  },
  async updateItem(_t, productId, quantity) {
    await delay(100)
    if (quantity <= 0) cartState.delete(productId)
    else cartState.set(productId, quantity)
    return snapshot()
  },
  async removeItem(_t, productId) {
    await delay(100)
    cartState.delete(productId)
    return snapshot()
  },
  async clearCart() {
    await delay(300)
    cartState.clear()
    return snapshot()
  },
}

export const api: Api = USE_MOCK ? mockApi : httpApi

export const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
