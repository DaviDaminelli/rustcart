// Espelha os DTOs da API Actix (api/src/models.rs)

export type Category = 'cafe' | 'livros' | 'audio' | 'casa' | 'escritorio'

export interface Product {
  id: number
  name: string
  description: string
  category: Category
  price_cents: number
  stock: number
}

export interface User {
  id: number
  name: string
  email: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Cart {
  items: CartItem[]
  total_cents: number
}
