import type { Product, User } from '@/types'

export const mockUser: User = {
  id: 1,
  name: 'Cliente Demo',
  email: 'demo@rustcart.dev',
}

export const mockProducts: Product[] = [
  { id: 1, name: 'Café Especial 250g', description: 'Grãos torra média, notas de chocolate e caramelo.', category: 'cafe', price_cents: 4290, stock: 32 },
  { id: 2, name: 'Prensa Francesa 600ml', description: 'Vidro borossilicato com filtro de aço inox.', category: 'cafe', price_cents: 12900, stock: 12 },
  { id: 3, name: 'The Rust Programming Language', description: 'O livro oficial, edição impressa.', category: 'livros', price_cents: 18990, stock: 8 },
  { id: 4, name: 'Zero To Production', description: 'Backend em Rust do zero ao deploy.', category: 'livros', price_cents: 21500, stock: 5 },
  { id: 5, name: 'Fone Bluetooth ANC', description: 'Cancelamento de ruído e 30h de bateria.', category: 'audio', price_cents: 49900, stock: 14 },
  { id: 6, name: 'Caixa de Som Portátil', description: 'À prova d’água IPX7, som 360°.', category: 'audio', price_cents: 32990, stock: 0 },
  { id: 7, name: 'Luminária de Mesa LED', description: 'Três temperaturas de cor e carregador USB-C.', category: 'casa', price_cents: 15900, stock: 21 },
  { id: 8, name: 'Planta Jiboia em Vaso', description: 'Fácil de cuidar, ideal para meia-sombra.', category: 'casa', price_cents: 6990, stock: 40 },
  { id: 9, name: 'Teclado Mecânico 75%', description: 'Switches tácteis, hot-swap, layout ABNT2.', category: 'escritorio', price_cents: 58900, stock: 9 },
  { id: 10, name: 'Mousepad XL', description: 'Base emborrachada, 90 × 40 cm.', category: 'escritorio', price_cents: 8990, stock: 27 },
  { id: 11, name: 'Caderno Pontilhado A5', description: '160 páginas, papel 120 g/m².', category: 'escritorio', price_cents: 5490, stock: 50 },
  { id: 12, name: 'Caneca Ferris 350ml', description: 'Cerâmica com o mascote do Rust.', category: 'cafe', price_cents: 4990, stock: 18 },
]

/** Itens que já aparecem no carrinho ao entrar — deixa o print do carrinho mais rico. */
export const mockInitialCart: { product_id: number; quantity: number }[] = [
  { product_id: 3, quantity: 1 },
  { product_id: 1, quantity: 2 },
  { product_id: 9, quantity: 1 },
]
