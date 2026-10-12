import type { LucideIcon } from 'lucide-react'

export function Icone({ icone: Desenho, tamanho = 16 }: { icone: LucideIcon; tamanho?: number }) {
  return <Desenho aria-hidden="true" size={tamanho} strokeWidth={2} className="icone" />
}
