import { describe, expect, test } from 'vitest'
import { descreverEscalas, LIMITE_LADO, montarLimites, resolverDimensoes } from '../../src/core/dimensoes'

const base = {
  manterDimensoes: false,
  manterProporcao: true,
  referencia: 'largura' as const,
  textoLargura: '',
  textoAltura: '',
}

describe('dimensões', () => {
  test('limita a largura e calcula a altura de cada imagem', () => {
    const horizontal = resolverDimensoes(1800, 1000, { modo: 'proporcional', referencia: 'largura', largura: 100 })
    const vertical = resolverDimensoes(800, 1200, { modo: 'proporcional', referencia: 'largura', largura: 100 })
    expect(horizontal.ok && horizontal.dimensao).toMatchObject({ largura: 100, altura: 56, redimensionou: true })
    expect(vertical.ok && vertical.dimensao).toMatchObject({ largura: 100, altura: 150, redimensionou: true })
  })

  test('limita a altura e calcula a largura de cada imagem', () => {
    const horizontal = resolverDimensoes(2000, 1000, { modo: 'proporcional', referencia: 'altura', altura: 100 })
    const vertical = resolverDimensoes(1000, 2000, { modo: 'proporcional', referencia: 'altura', altura: 1000 })
    expect(horizontal.ok && horizontal.dimensao).toMatchObject({ largura: 200, altura: 100 })
    expect(vertical.ok && vertical.dimensao).toMatchObject({ largura: 500, altura: 1000 })
  })

  test('não amplia imagem menor que o limite proporcional', () => {
    const saida = resolverDimensoes(100, 50, { modo: 'proporcional', referencia: 'largura', largura: 1000 })
    expect(saida.ok && saida.dimensao).toMatchObject({ largura: 100, altura: 50, redimensionou: false })
  })

  test('arredonda 1000×333 para largura 100', () => {
    const saida = resolverDimensoes(1000, 333, { modo: 'proporcional', referencia: 'largura', largura: 100 })
    expect(saida.ok && saida.dimensao).toMatchObject({ largura: 100, altura: 33 })
  })

  test('dimensões exatas podem deformar e recusam ampliação', () => {
    const quadrada = resolverDimensoes(1800, 1000, { modo: 'exato', largura: 100, altura: 100 })
    const igual = resolverDimensoes(40, 30, { modo: 'exato', largura: 40, altura: 30 })
    const amplia = resolverDimensoes(40, 30, { modo: 'exato', largura: 80, altura: 30 })
    expect(quadrada.ok && quadrada.dimensao).toMatchObject({
      largura: 100,
      altura: 100,
      redimensionou: true,
      escalaLargura: 100 / 1800,
      escalaAltura: 100 / 1000,
    })
    expect(igual.ok && igual.dimensao.redimensionou).toBe(false)
    expect(amplia).toEqual({ ok: false, codigo: 'AMPLIACAO_RECUSADA' })
  })

  test('manter originais ignora texto e a proporção exige o lado ativo', () => {
    expect(montarLimites({ ...base, manterDimensoes: true, textoLargura: '0', textoAltura: 'abc' })).toEqual({
      ok: true,
      pedido: { modo: 'nenhum' },
    })
    expect(montarLimites(base)).toEqual({ ok: false, mensagem: 'Informe a largura máxima.' })
    expect(montarLimites({ ...base, referencia: 'altura' })).toEqual({ ok: false, mensagem: 'Informe a altura máxima.' })
    expect(montarLimites({ ...base, textoLargura: '0' }).ok).toBe(false)
    expect(montarLimites({ ...base, textoLargura: '1.5' }).ok).toBe(false)
    expect(montarLimites({ ...base, textoLargura: String(LIMITE_LADO + 1) }).ok).toBe(false)
    expect(montarLimites({ ...base, textoLargura: '0500' })).toEqual({
      ok: true,
      pedido: { modo: 'proporcional', referencia: 'largura', largura: 500 },
    })
  })

  test('modo exato exige os dois campos e ignora texto inválido do lado inativo', () => {
    expect(montarLimites({ ...base, manterProporcao: false, textoLargura: '100', textoAltura: '' })).toEqual({
      ok: false,
      mensagem: 'Informe a largura final e a altura final.',
    })
    expect(montarLimites({ ...base, manterProporcao: false, textoLargura: '100', textoAltura: '0' }).ok).toBe(false)
    expect(montarLimites({ ...base, textoLargura: '100', textoAltura: 'abc' })).toEqual({
      ok: true,
      pedido: { modo: 'proporcional', referencia: 'largura', largura: 100 },
    })
    expect(montarLimites({ ...base, manterProporcao: false, textoLargura: '80', textoAltura: '40' })).toEqual({
      ok: true,
      pedido: { modo: 'exato', largura: 80, altura: 40 },
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
