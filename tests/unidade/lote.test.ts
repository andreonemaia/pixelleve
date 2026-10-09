import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { classificarArquivo } from '../../src/importacao/classificar'
import { descreverPar, formatarTamanho, resumirLote, textoResumo } from '../../src/core/tamanhos'

const fixtures = join(import.meta.dirname, '../fixtures')

describe('tamanhos do lote', () => {
  test('formata bytes reais em português', () => {
    expect(formatarTamanho(151)).toBe('151 B')
    expect(formatarTamanho(620 * 1024)).toBe('620 KB')
    expect(formatarTamanho(Math.round(2.4 * 1024 * 1024))).toBe('2,4 MB')
    expect(formatarTamanho(Math.round(1.78 * 1024 * 1024))).toBe('1,78 MB')
  })

  test('descreve economia e aumento a partir dos bytes', () => {
    const texto = descreverPar(Math.round(2.4 * 1024 * 1024), 620 * 1024, false)
    expect(texto).toContain('2,4 MB → 620 KB')
    expect(texto).toContain('Economizou')
    expect(descreverPar(500, 800, false)).toContain('Aumentou')
    expect(descreverPar(500, 500, true)).toContain('Economia zero')
    expect(descreverPar(500, 500, false)).toContain('Mesmo tamanho')
  })

  test('calcula a porcentagem global pela soma dos bytes', () => {
    const resumo = resumirLote([
      { bytesEntrada: 1000, bytesSaida: 500 },
      { bytesEntrada: 100, bytesSaida: 90 },
    ])
    expect(resumo.bytesEntrada).toBe(1100)
    expect(resumo.bytesSaida).toBe(590)
    expect(resumo.economiaBytes).toBe(510)
    expect(resumo.percentual).toBeCloseTo((510 / 1100) * 100)
    expect(resumo.percentual).not.toBeCloseTo(30)
    expect(textoResumo(resumo, true)).toContain('Economia até agora')
    expect(textoResumo(resumirLote([]), true)).toBe('Economia até agora: nenhuma imagem concluída')
  })

  test('não trata arquivo inválido como imagem aceita', () => {
    const invalido = readFileSync(join(fixtures, 'invalido.jpg'))
    const animado = readFileSync(join(fixtures, 'animado.apng'))
    expect(classificarArquivo('notas.txt', 'text/plain', 10, new Uint8Array([1])).tipo).toBe('ignorado')
    const falha = classificarArquivo('invalido.jpg', 'image/jpeg', invalido.byteLength, invalido)
    expect(falha.tipo).toBe('fila')
    if (falha.tipo === 'fila') expect(falha.estado).toBe('falha')
    const animacao = classificarArquivo('animado.apng', 'image/png', animado.byteLength, animado)
    expect(animacao.tipo).toBe('fila')
    if (animacao.tipo === 'fila' && animacao.estado === 'falha') expect(animacao.mensagem).toContain('animadas')
  })
})
