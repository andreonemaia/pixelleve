import { describe, expect, test } from 'vitest'
import { aplicarFundo } from '../../src/core/alpha'
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

  test('vermelho opaco ao lado de preto transparente não escurece a cor visível', () => {
    const saida = redimensionarRgba(rgba([[255, 0, 0, 255], [0, 0, 0, 0]]), 2, 1, 1, 1)
    expect([...saida]).toEqual([255, 0, 0, 128])
    expect([...aplicarFundo(saida, 1, 1, '#ffffff')]).toEqual([255, 127, 127, 255])
    expect([...aplicarFundo(saida, 1, 1, '#000000')]).toEqual([128, 0, 0, 255])
  })

  test('azul totalmente transparente não contamina o vermelho', () => {
    const comPreto = redimensionarRgba(rgba([[255, 0, 0, 255], [0, 0, 0, 0]]), 2, 1, 1, 1)
    const comAzul = redimensionarRgba(rgba([[255, 0, 0, 255], [0, 0, 255, 0]]), 2, 1, 1, 1)
    expect([...comAzul]).toEqual([...comPreto])
    expect(aplicarFundo(comAzul, 1, 1, '#000000')[2]).toBe(0)
    expect(aplicarFundo(comAzul, 1, 1, '#ffffff')[0]).toBe(255)
  })

  test('transparência parcial pondera a cor pelo alpha', () => {
    const saida = redimensionarRgba(rgba([[255, 0, 0, 255], [0, 0, 255, 128]]), 2, 1, 1, 1)
    expect([...saida]).toEqual([170, 0, 85, 192])
    expect([...saida]).not.toEqual([128, 0, 128, 192])
    const claro = aplicarFundo(saida, 1, 1, '#ffffff')
    const escuro = aplicarFundo(saida, 1, 1, '#000000')
    expect(claro[0]).toBeGreaterThan(claro[2])
    expect(escuro[0]).toBeGreaterThan(escuro[2])
  })
})

function rgba(pixels: number[][]): Uint8ClampedArray {
  return Uint8ClampedArray.from(pixels.flat())
}
