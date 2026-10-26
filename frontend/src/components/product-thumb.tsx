import { BookOpen, Coffee, Headphones, Keyboard, Lamp, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

export const CATEGORY: Record<Category, { label: string; icon: LucideIcon; tint: string }> = {
  cafe: { label: 'Café', icon: Coffee, tint: 'bg-amber-100 text-amber-700' },
  livros: { label: 'Livros', icon: BookOpen, tint: 'bg-orange-100 text-orange-700' },
  audio: { label: 'Áudio', icon: Headphones, tint: 'bg-sky-100 text-sky-700' },
  casa: { label: 'Casa', icon: Lamp, tint: 'bg-emerald-100 text-emerald-700' },
  escritorio: { label: 'Escritório', icon: Keyboard, tint: 'bg-violet-100 text-violet-700' },
}

/** Placeholder de imagem do produto: ícone da categoria sobre fundo colorido. */
export function ProductThumb({ category, className }: { category: Category; className?: string }) {
  const { icon: Icon, tint } = CATEGORY[category]
  return (
    <div className={cn('flex items-center justify-center rounded-lg', tint, className)}>
      <Icon className="size-1/3" strokeWidth={1.5} />
    </div>
  )
}
