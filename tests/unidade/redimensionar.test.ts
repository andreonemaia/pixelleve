import { describe, expect, test } from 'vitest'
import { redimensionarRgba } from '../../src/motor/redimensionar'

describe('redimensionar', () => {
  test('média 2×2 opaca', () => {
    const origem = rgba([
      [255, 0, 0, 255],
      [0, 0, 255, 255],
      [0, 255, 0, 255],
      [255, 255, 0, 255],
    ])
    const saida = [...redimensionarRgba(origem, 2, 2, 1, 1)]
    expect(saida).toEqual([128, 128, 64, 255])
  })

  test('região transparente continua com alpha zero', () => {
    const origem = rgba([
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [255, 0, 0, 255],
      [255, 0, 0, 255],
    ])
    const saida = redimensionarRgba(origem, 4, 1, 2, 1)
    expect([...saida.slice(0, 4)]).toEqual([0, 0, 0, 0])
    expect([...saida.slice(4, 8)]).toEqual([255, 0, 0, 255])
  })
})

function rgba(pixels: number[][]): Uint8ClampedArray {
  return Uint8ClampedArray.from(pixels.flat())
}
