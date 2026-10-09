export interface AmostraPixels {
  largura: number
  altura: number
  pixels: ArrayLike<number>
}

export type MotivoPixels = 'iguais' | 'dimensoes' | 'canais' | 'pixel'

export function compararPixels(esquerda: AmostraPixels, direita: AmostraPixels): { iguais: boolean; motivo: MotivoPixels } {
  if (esquerda.largura !== direita.largura || esquerda.altura !== direita.altura) {
    return { iguais: false, motivo: 'dimensoes' }
  }
  const quantidade = esquerda.largura * esquerda.altura * 4
  if (esquerda.pixels.length !== quantidade || direita.pixels.length !== quantidade) {
    return { iguais: false, motivo: 'canais' }
  }
  for (let indice = 0; indice < quantidade; indice += 1) {
    if (esquerda.pixels[indice] !== direita.pixels[indice]) return { iguais: false, motivo: 'pixel' }
  }
  return { iguais: true, motivo: 'iguais' }
}

export function somaCanais(pixels: ArrayLike<number>): number {
  let soma = 0
  for (let indice = 0; indice < pixels.length; indice += 1) soma = (soma + pixels[indice]) >>> 0
  return soma
}
