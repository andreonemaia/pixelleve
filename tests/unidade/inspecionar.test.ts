import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { inspecionarImagem } from '../../src/core/inspecionar'

const pasta = join(dirname(fileURLToPath(import.meta.url)), '../fixtures')

function ler(nome: string): Uint8Array {
  return new Uint8Array(readFileSync(join(pasta, nome)))
}

describe('inspeção de arquivos', () => {
  it('lê PNG com transparência e PNG opaco', () => {
    const grafico = inspecionarImagem(ler('grafico-alpha.png'))
    const texto = inspecionarImagem(ler('texto.png'))
    expect(grafico.ok && grafico.inspecao).toMatchObject({
      formato: 'png',
      largura: 32,
      altura: 32,
      possuiAlpha: true,
    })
    expect(texto.ok && texto.inspecao).toMatchObject({
      formato: 'png',
      largura: 80,
      altura: 24,
      possuiAlpha: false,
    })
  })

  it('rejeita animação, arquivo truncado e conteúdo inválido', () => {
    expect(inspecionarImagem(ler('animado.apng'))).toMatchObject({
      ok: false,
      erro: { codigo: 'ANIMATED_INPUT' },
    })
    expect(inspecionarImagem(ler('animado.webp'))).toMatchObject({
      ok: false,
      erro: { codigo: 'ANIMATED_INPUT' },
    })
    expect(inspecionarImagem(ler('truncado.png'))).toMatchObject({
      ok: false,
      erro: { codigo: 'INVALID_IMAGE' },
    })
    expect(inspecionarImagem(ler('invalido.jpg'))).toMatchObject({
      ok: false,
      erro: { codigo: 'UNSUPPORTED_FORMAT' },
    })
  })

  it('distingue GIF estático de GIF com mais de um quadro', () => {
    const estatico = Uint8Array.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
      0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x01, 0x44, 0x00, 0x3b,
    ])
    const animado = Uint8Array.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
      0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x01, 0x44, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x01, 0x44, 0x00, 0x3b,
    ])
    expect(inspecionarImagem(estatico)).toMatchObject({
      ok: false,
      erro: { codigo: 'UNSUPPORTED_FORMAT' },
    })
    expect(inspecionarImagem(animado)).toMatchObject({
      ok: false,
      erro: { codigo: 'ANIMATED_INPUT' },
    })
  })
})
