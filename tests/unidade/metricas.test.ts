import { describe, expect, it } from 'vitest'
import { calcularEconomia, descreverEconomia } from '../../src/core/metricas'
import { escolherSaida } from '../../src/core/escolherSaida'
import { aplicarFundo, possuiTransparencia } from '../../src/core/alpha'
import { nomeDeSaida } from '../../src/core/nomes'
import { nivelOxiPng, qualidadeDoPreset } from '../../src/core/presets'

describe('métricas e escolha de saída', () => {
  it('calcula economia sobre os bytes, não como média', () => {
    expect(calcularEconomia(1000, 750)).toBe(25)
    expect(calcularEconomia(1000, 1180)).toBeCloseTo(-18)
  })

  it('descreve original mantido, redução e aumento', () => {
    expect(descreverEconomia(100, 100, true)).toBe('Já estava otimizada')
    expect(descreverEconomia(1000, 750, false)).toBe('25% menor')
    expect(descreverEconomia(1000, 1180, false)).toBe('18% maior')
  })

  it('devolve o original quando manter formato não reduz', () => {
    const entrada = new Uint8Array([1, 2, 3, 4])
    const maior = new Uint8Array([1, 2, 3, 4, 5])
    const menor = new Uint8Array([1, 2])
    expect(escolherSaida(entrada, maior, true).usouOriginal).toBe(true)
    expect(escolherSaida(entrada, menor, true).bytes).toEqual(menor)
    expect(escolherSaida(entrada, maior, false).usouOriginal).toBe(false)
    expect(escolherSaida(entrada, maior, false).bytes).toEqual(maior)
  })

  it('compõe transparência só com fundo explícito', () => {
    const pixels = new Uint8ClampedArray([255, 0, 0, 128])
    expect(possuiTransparencia(pixels)).toBe(true)
    const composto = aplicarFundo(pixels, 1, 1, '#000000')
    expect(Array.from(composto)).toEqual([128, 0, 0, 255])
  })

  it('limpa nomes e aplica a extensão pedida', () => {
    expect(nomeDeSaida('..\\fotos\\praia final.png', 'webp')).toBe('praia final.webp')
  })

  it('separa qualidade com perdas do esforço do PNG', () => {
    expect(qualidadeDoPreset('leve')).toBe(85)
    expect(qualidadeDoPreset('equilibrado')).toBe(75)
    expect(qualidadeDoPreset('maxima')).toBe(60)
    expect(nivelOxiPng('equilibrado')).toBe(2)
  })
})
