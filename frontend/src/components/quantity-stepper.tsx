import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  value: number
  max: number
  disabled?: boolean
  onChange(value: number): void
}

export function QuantityStepper({ value, max, disabled, onChange }: Props) {
  return (
    <div className="inline-flex items-center rounded-lg border">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Diminuir"
        disabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Minus />
      </Button>
      <span className="w-8 text-center text-sm tabular-nums">{value}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Aumentar"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus />
      </Button>
    </div>
  )
}
