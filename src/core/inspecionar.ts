import { mensagemDoCodigo } from './mensagens'
import type { FalhaInspecao, FormatoImagem, InspecaoImagem, ResultadoInspecao } from './tipos'

export const LIMITE_BYTES = 40 * 1024 * 1024
export const LIMITE_PIXELS = 24_000_000

const ASSINATURA_PNG = [137, 80, 78, 71, 13, 10, 26, 10]

export function inspecionarImagem(bytes: Uint8Array): ResultadoInspecao | FalhaInspecao {
  if (bytes.byteLength > LIMITE_BYTES) return falha('TOO_LARGE')
  if (bytes.byteLength < 12) return falha('INVALID_IMAGE')

  if (comecaCom(bytes, ASSINATURA_PNG)) return validarPixels(inspecionarPng(bytes))
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return validarPixels(inspecionarJpeg(bytes))
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') {
    return validarPixels(inspecionarWebp(bytes))
  }
  if (ascii(bytes, 0, 6) === 'GIF87a' || ascii(bytes, 0, 6) === 'GIF89a') {
    return inspecionarGif(bytes)
  }
  return falha('UNSUPPORTED_FORMAT')
}

function validarPixels(resultado: ResultadoInspecao | FalhaInspecao): ResultadoInspecao | FalhaInspecao {
  if (!resultado.ok) return resultado
  const pixels = resultado.inspecao.largura * resultado.inspecao.altura
  if (pixels > LIMITE_PIXELS) return falha('TOO_LARGE')
  return resultado
}

function inspecionarPng(bytes: Uint8Array): ResultadoInspecao | FalhaInspecao {
  let offset = 8
  let largura = 0
  let altura = 0
  let possuiAlpha = false
  let viuCabecalho = false
  let viuDados = false
  let viuFim = false
  let animado = false

  while (offset + 12 <= bytes.length) {
    const tamanho = lerU32be(bytes, offset)
    const tipo = ascii(bytes, offset + 4, 4)
    const inicio = offset + 8
    if (inicio + tamanho + 4 > bytes.length) return falha('INVALID_IMAGE')

    if (tipo === 'IHDR') {
      if (tamanho < 13) return falha('INVALID_IMAGE')
      largura = lerU32be(bytes, inicio)
      altura = lerU32be(bytes, inicio + 4)
      const tipoCor = bytes[inicio + 9]
      possuiAlpha = tipoCor === 4 || tipoCor === 6
      viuCabecalho = largura > 0 && altura > 0
    } else if (tipo === 'tRNS') {
      possuiAlpha = true
    } else if (tipo === 'acTL') {
      animado = true
    } else if (tipo === 'IDAT') {
      viuDados = true
    } else if (tipo === 'IEND') {
      viuFim = true
    }

    offset = inicio + tamanho + 4
  }

  if (!viuCabecalho || !viuDados || !viuFim) return falha('INVALID_IMAGE')
  if (animado) return falha('ANIMATED_INPUT')
  return sucesso({ formato: 'png', largura, altura, possuiAlpha })
}

function inspecionarJpeg(bytes: Uint8Array): ResultadoInspecao | FalhaInspecao {
  let indice = 2
  while (indice + 3 < bytes.length) {
    if (bytes[indice] !== 0xff) {
      indice += 1
      continue
    }
    const marcador = bytes[indice + 1]
    if (marcador === 0xd8 || marcador === 0x00 || marcador === 0xff) {
      indice += 1
      continue
    }
    if (marcador === 0xd9 || marcador === 0xda) break
    if (marcador >= 0xd0 && marcador <= 0xd7) {
      indice += 2
      continue
    }

    const tamanho = (bytes[indice + 2] << 8) | bytes[indice + 3]
    if (tamanho < 2 || indice + 2 + tamanho > bytes.length) return falha('INVALID_IMAGE')

    const ehQuadro =
      (marcador >= 0xc0 && marcador <= 0xc3) ||
      (marcador >= 0xc5 && marcador <= 0xc7) ||
      (marcador >= 0xc9 && marcador <= 0xcb) ||
      (marcador >= 0xcd && marcador <= 0xcf)

    if (ehQuadro) {
      if (tamanho < 8) return falha('INVALID_IMAGE')
      const altura = (bytes[indice + 5] << 8) | bytes[indice + 6]
      const largura = (bytes[indice + 7] << 8) | bytes[indice + 8]
      if (largura <= 0 || altura <= 0) return falha('INVALID_IMAGE')
      return sucesso({ formato: 'jpeg', largura, altura, possuiAlpha: false })
    }

    indice += 2 + tamanho
  }

  return falha('INVALID_IMAGE')
}

function inspecionarWebp(bytes: Uint8Array): ResultadoInspecao | FalhaInspecao {
  let offset = 12
  let largura = 0
  let altura = 0
  let possuiAlpha = false
  let animado = false
  let viuQuadro = false

  while (offset + 8 <= bytes.length) {
    const tipo = ascii(bytes, offset, 4)
    const tamanho = lerU32le(bytes, offset + 4)
    const inicio = offset + 8
    if (inicio + tamanho > bytes.length) return falha('INVALID_IMAGE')

    if (tipo === 'VP8X' && tamanho >= 10) {
      const flags = bytes[inicio]
      if ((flags & 0x02) !== 0) animado = true
      if ((flags & 0x10) !== 0) possuiAlpha = true
      largura = 1 + bytes[inicio + 4] + (bytes[inicio + 5] << 8) + (bytes[inicio + 6] << 16)
      altura = 1 + bytes[inicio + 7] + (bytes[inicio + 8] << 8) + (bytes[inicio + 9] << 16)
      viuQuadro = largura > 0 && altura > 0
    } else if (tipo === 'ANIM' || tipo === 'ANMF') {
      animado = true
    } else if (tipo === 'ALPH') {
      possuiAlpha = true
    } else if (tipo === 'VP8 ' && tamanho >= 10) {
      const quadro = lerQuadroVp8(bytes, inicio)
      if (quadro) {
        largura = quadro.largura
        altura = quadro.altura
        viuQuadro = true
      }
    } else if (tipo === 'VP8L' && tamanho >= 5 && bytes[inicio] === 0x2f) {
      const quadro = lerQuadroVp8l(bytes, inicio)
      largura = quadro.largura
      altura = quadro.altura
      possuiAlpha = quadro.possuiAlpha
      viuQuadro = true
    }

    offset = inicio + tamanho + (tamanho % 2)
  }

  if (animado) return falha('ANIMATED_INPUT')
  if (!viuQuadro || largura <= 0 || altura <= 0) return falha('INVALID_IMAGE')
  return sucesso({ formato: 'webp', largura, altura, possuiAlpha })
}

function inspecionarGif(bytes: Uint8Array): ResultadoInspecao | FalhaInspecao {
  if (bytes.length < 13) return falha('INVALID_IMAGE')
  let indice = 13
  const empacotado = bytes[10]
  if ((empacotado & 0x80) !== 0) {
    indice += 3 * 2 ** ((empacotado & 0x07) + 1)
  }

  let quadros = 0
  while (indice < bytes.length) {
    const bloco = bytes[indice]
    if (bloco === 0x3b) break
    if (bloco === 0x21) {
      indice += 2
      indice = pularSubblocos(bytes, indice)
      continue
    }
    if (bloco === 0x2c) {
      if (indice + 10 > bytes.length) return falha('INVALID_IMAGE')
      quadros += 1
      const local = bytes[indice + 9]
      indice += 10
      if ((local & 0x80) !== 0) indice += 3 * 2 ** ((local & 0x07) + 1)
      indice += 1
      indice = pularSubblocos(bytes, indice)
      continue
    }
    return falha('INVALID_IMAGE')
  }

  if (quadros > 1) return falha('ANIMATED_INPUT')
  if (quadros === 1) return falha('UNSUPPORTED_FORMAT')
  return falha('INVALID_IMAGE')
}

function lerQuadroVp8(bytes: Uint8Array, inicio: number): { largura: number; altura: number } | undefined {
  if (bytes[inicio + 3] !== 0x9d || bytes[inicio + 4] !== 0x01 || bytes[inicio + 5] !== 0x2a) {
    return undefined
  }
  const largura = (bytes[inicio + 6] | (bytes[inicio + 7] << 8)) & 0x3fff
  const altura = (bytes[inicio + 8] | (bytes[inicio + 9] << 8)) & 0x3fff
  if (largura <= 0 || altura <= 0) return undefined
  return { largura, altura }
}

function lerQuadroVp8l(bytes: Uint8Array, inicio: number): {
  largura: number
  altura: number
  possuiAlpha: boolean
} {
  const b0 = bytes[inicio + 1]
  const b1 = bytes[inicio + 2]
  const b2 = bytes[inicio + 3]
  const b3 = bytes[inicio + 4]
  return {
    largura: 1 + (b0 | ((b1 & 0x3f) << 8)),
    altura: 1 + (((b1 & 0xc0) >> 6) | (b2 << 2) | ((b3 & 0x0f) << 10)),
    possuiAlpha: (b3 & 0x10) !== 0,
  }
}

function pularSubblocos(bytes: Uint8Array, inicio: number): number {
  let indice = inicio
  while (indice < bytes.length) {
    const tamanho = bytes[indice]
    indice += 1
    if (tamanho === 0) return indice
    indice += tamanho
  }
  return indice
}

function sucesso(inspecao: InspecaoImagem): ResultadoInspecao {
  return { ok: true, inspecao }
}

function falha(codigo: FalhaInspecao['erro']['codigo']): FalhaInspecao {
  return { ok: false, erro: { codigo, mensagem: mensagemDoCodigo(codigo) } }
}

function comecaCom(bytes: Uint8Array, assinatura: number[]): boolean {
  if (bytes.length < assinatura.length) return false
  return assinatura.every((valor, indice) => bytes[indice] === valor)
}

function ascii(bytes: Uint8Array, offset: number, tamanho: number): string {
  let texto = ''
  for (let indice = 0; indice < tamanho; indice += 1) {
    texto += String.fromCharCode(bytes[offset + indice] ?? 0)
  }
  return texto
}

function lerU32be(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0
  )
}

function lerU32le(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)) >>>
    0
  )
}

export function descricaoFormato(formato: FormatoImagem): string {
  if (formato === 'jpeg') return 'JPEG'
  if (formato === 'png') return 'PNG'
  return 'WebP'
}
