import { describe, expect, test } from 'vitest'
import { compararPixels, somaCanais } from '../../src/core/pixels'

describe('pixels', () => {
  test('exige dimensões e cada canal RGBA', () => {
    const pixels = [10, 20, 30, 255, 1, 2, 3, 4]
    expect(compararPixels(amostra(2, 1, pixels), amostra(2, 1, pixels))).toEqual({ iguais: true, motivo: 'iguais' })
    expect(compararPixels(amostra(2, 1, pixels), amostra(1, 2, pixels)).motivo).toBe('dimensoes')
  })

  test('rejeita pixels diferentes que têm a mesma soma de canais', () => {
    const esquerda = [1, 2, 3, 4, 9, 1, 1, 1]
    const direita = [9, 1, 1, 1, 1, 2, 3, 4]
    expect(somaCanais(esquerda)).toBe(somaCanais(direita))
    expect(compararPixels(amostra(2, 1, esquerda), amostra(2, 1, direita))).toEqual({
      iguais: false,
      motivo: 'pixel',
    })
  })
})

function amostra(largura: number, altura: number, pixels: number[]) {
  return { largura, altura, pixels }
}
