import { describe, expect, test } from 'vitest'
import {
  calcularDimensoes,
  descreverEscalas,
  LIMITE_LADO,
  montarLimites,
} from '../../src/core/dimensoes'

describe('dimensões', () => {
  test('encaixa 2000×1000 na largura 1000 sem distorcer', () => {
    const saida = calcularDimensoes(2000, 1000, { larguraMaxima: 1000 })
    expect(saida).toMatchObject({ largura: 1000, altura: 500, redimensionou: true })
  })

  test('encaixa imagem vertical pela altura', () => {
    const saida = calcularDimensoes(1000, 2000, { alturaMaxima: 1000 })
    expect(saida).toMatchObject({ largura: 500, altura: 1000, redimensionou: true })
  })

  test('com dois limites cabe no retângulo sem recortar', () => {
    const saida = calcularDimensoes(1000, 500, { larguraMaxima: 400, alturaMaxima: 100 })
    expect(saida.largura).toBeLessThanOrEqual(400)
    expect(saida.altura).toBeLessThanOrEqual(100)
    expect(saida).toMatchObject({ largura: 200, altura: 100, redimensionou: true })
  })

  test('não amplia imagem menor que os limites', () => {
    const saida = calcularDimensoes(100, 50, { larguraMaxima: 1000, alturaMaxima: 1000 })
    expect(saida).toMatchObject({ largura: 100, altura: 50, redimensionou: false })
  })

  test('arredonda 1000×333 para largura 100', () => {
    const saida = calcularDimensoes(1000, 333, { larguraMaxima: 100 })
    expect(saida).toMatchObject({ largura: 100, altura: 33 })
  })

  test('só amplia quando o pedido pede', () => {
    const sem = calcularDimensoes(100, 50, { larguraMaxima: 200, alturaMaxima: 200, ampliar: false })
    const com = calcularDimensoes(100, 50, { larguraMaxima: 200, alturaMaxima: 200, ampliar: true })
    expect(sem.redimensionou).toBe(false)
    expect(com).toMatchObject({ largura: 200, altura: 100, redimensionou: true })
  })

  test('rejeita texto inválido e aceita campo vazio', () => {
    expect(montarLimites({ manterDimensoes: false, textoLargura: '0', textoAltura: '' }).ok).toBe(false)
    expect(montarLimites({ manterDimensoes: false, textoLargura: '1.5', textoAltura: '10' }).ok).toBe(false)
    expect(montarLimites({ manterDimensoes: false, textoLargura: 'abc', textoAltura: '' }).ok).toBe(false)
    expect(montarLimites({ manterDimensoes: false, textoLargura: String(LIMITE_LADO + 1), textoAltura: '' }).ok).toBe(false)
    const vazio = montarLimites({ manterDimensoes: false, textoLargura: '', textoAltura: '' })
    expect(vazio).toEqual({ ok: true, ampliar: false })
    const cheio = montarLimites({ manterDimensoes: false, textoLargura: '1000', textoAltura: '0500' })
    expect(cheio).toEqual({ ok: true, larguraMaxima: 1000, alturaMaxima: 500, ampliar: false })
  })

  test('manter dimensões ignora texto inválido', () => {
    expect(montarLimites({ manterDimensoes: true, textoLargura: '0', textoAltura: 'abc' })).toEqual({
      ok: true,
      ampliar: false,
    })
  })

  test('descreve escalas diferentes sem chamar ampliação de 100%', () => {
    const texto = descreverEscalas(2000, 1000, 1000, 500)
    expect(texto).toContain('2000×1000')
    expect(texto).toContain('1000×500')
    expect(texto).toContain('50%')
    expect(texto).toContain('Em 100%')
  })
})
