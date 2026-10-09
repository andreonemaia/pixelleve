import { aplicarFundo, fundoValido, possuiTransparencia } from '../core/alpha'
import {
  codificarJpeg,
  codificarPng,
  codificarWebp,
  decodificarImagem,
  otimizarPng,
} from '../codecs/codecs'
import { calcularDimensoes, limiteDimensaoValido } from '../core/dimensoes'
import { escolherSaida } from '../core/escolherSaida'
import { ErroMotor } from '../core/erros'
import { inspecionarImagem, LIMITE_PIXELS } from '../core/inspecionar'
import { nivelOxiPng, qualidadeDoPreset } from '../core/presets'
import type { FormatoImagem, OpcoesProcessamento, SaidaMotor } from '../core/tipos'
import { redimensionarRgba } from './redimensionar'

const DESCRICAO_SAIDA: Record<FormatoImagem, { mime: string; extensao: string }> = {
  jpeg: { mime: 'image/jpeg', extensao: 'jpg' },
  png: { mime: 'image/png', extensao: 'png' },
  webp: { mime: 'image/webp', extensao: 'webp' },
}

export async function processarImagem(
  buffer: ArrayBuffer,
  opcoes: OpcoesProcessamento,
): Promise<SaidaMotor> {
  const entrada = new Uint8Array(buffer.slice(0))
  const inspecaoInicial = inspecionarImagem(entrada)
  if (!inspecaoInicial.ok) throw new ErroMotor(inspecaoInicial.erro.codigo)

  const origem = inspecaoInicial.inspecao
  const formatoSaida: FormatoImagem = opcoes.formato === 'original' ? origem.formato : opcoes.formato
  const manter = opcoes.formato === 'original'
  const descricao = DESCRICAO_SAIDA[formatoSaida]

  if (formatoSaida === 'jpeg' && origem.possuiAlpha && !fundoValido(opcoes.fundoJpeg)) {
    throw new ErroMotor('ALPHA_BACKGROUND_REQUIRED')
  }
  if (!limiteDimensaoValido(opcoes.larguraMaxima) || !limiteDimensaoValido(opcoes.alturaMaxima)) {
    throw new ErroMotor('INVALID_IMAGE')
  }

  const limites = {
    larguraMaxima: opcoes.larguraMaxima,
    alturaMaxima: opcoes.alturaMaxima,
    ampliar: opcoes.ampliar === true,
  }
  const previsto = calcularDimensoes(origem.largura, origem.altura, limites)

  if (formatoSaida === 'png' && origem.formato === 'png' && !previsto.redimensionou) {
    const otimizado = await otimizarPng(entrada, nivelOxiPng(opcoes.preset))
    const escolha = escolherSaida(entrada, otimizado, manter)
    conferirArquivo(escolha.bytes, 'png', origem.largura, origem.altura)
    return montarSaida(escolha.bytes, entrada.byteLength, origem.largura, origem.altura, descricao, escolha.usouOriginal, [
      escolha.usouOriginal
        ? 'Não houve redução. O arquivo original foi mantido, inclusive os metadados.'
        : 'PNG otimizado sem perdas com OxiPNG. Os pixels foram preservados.',
    ])
  }

  const imagem = await decodificarImagem(origem.formato, entrada)
  if (imagem.width * imagem.height > LIMITE_PIXELS) throw new ErroMotor('TOO_LARGE')

  const dimensao = calcularDimensoes(imagem.width, imagem.height, limites)
  if (dimensao.largura * dimensao.altura > LIMITE_PIXELS) throw new ErroMotor('TOO_LARGE')
  const redimensionada = dimensao.redimensionou
    ? criarImagem(
        redimensionarRgba(imagem.data, imagem.width, imagem.height, dimensao.largura, dimensao.altura),
        dimensao.largura,
        dimensao.altura,
      )
    : imagem

  const transparente = possuiTransparencia(redimensionada.data)
  if (formatoSaida === 'jpeg' && transparente && !fundoValido(opcoes.fundoJpeg)) {
    throw new ErroMotor('ALPHA_BACKGROUND_REQUIRED')
  }

  const pixels =
    formatoSaida === 'jpeg' && transparente
      ? criarImagem(
          aplicarFundo(redimensionada.data, redimensionada.width, redimensionada.height, opcoes.fundoJpeg ?? ''),
          redimensionada.width,
          redimensionada.height,
        )
      : redimensionada

  const qualidade = qualidadeDoPreset(opcoes.preset)
  const codificado =
    formatoSaida === 'jpeg'
      ? await codificarJpeg(pixels, qualidade)
      : formatoSaida === 'webp'
        ? await codificarWebp(pixels, qualidade)
        : await otimizarPng(await codificarPng(pixels), nivelOxiPng(opcoes.preset))

  const escolha = escolherSaida(entrada, codificado, manter && !dimensao.redimensionou)
  const larguraFinal = escolha.usouOriginal ? imagem.width : pixels.width
  const alturaFinal = escolha.usouOriginal ? imagem.height : pixels.height
  conferirArquivo(escolha.bytes, escolha.usouOriginal ? origem.formato : formatoSaida, larguraFinal, alturaFinal)

  const avisos = [
    escolha.usouOriginal
      ? 'Não houve redução. O arquivo original foi mantido, inclusive os metadados.'
      : 'A saída foi recodificada e não inclui EXIF, GPS ou outros metadados do original.',
  ]
  if (dimensao.redimensionou) {
    avisos.push(
      `Redimensionada de ${imagem.width}×${imagem.height} para ${larguraFinal}×${alturaFinal}. A proporção foi mantida${limites.ampliar ? '.' : ' e a imagem não foi ampliada.'}`,
    )
  }
  if (formatoSaida === 'jpeg' && transparente) {
    avisos.push('A transparência foi composta sobre a cor de fundo escolhida.')
  }

  return montarSaida(
    escolha.bytes,
    entrada.byteLength,
    larguraFinal,
    alturaFinal,
    escolha.usouOriginal ? DESCRICAO_SAIDA[origem.formato] : descricao,
    escolha.usouOriginal,
    avisos,
  )
}

function criarImagem(pixels: Uint8ClampedArray, largura: number, altura: number): ImageData {
  const copia = new Uint8ClampedArray(pixels.length)
  copia.set(pixels)
  return new ImageData(copia, largura, altura)
}

function montarSaida(
  bytes: Uint8Array,
  bytesEntrada: number,
  largura: number,
  altura: number,
  descricao: { mime: string; extensao: string },
  usouOriginal: boolean,
  avisos: string[],
): SaidaMotor {
  const copia = bytes.slice().buffer
  return {
    bytes: copia,
    mime: descricao.mime,
    extensao: descricao.extensao,
    largura,
    altura,
    bytesEntrada,
    bytesSaida: copia.byteLength,
    usouOriginal,
    avisos,
  }
}

function conferirArquivo(
  bytes: Uint8Array,
  formato: FormatoImagem,
  largura: number,
  altura: number,
): void {
  const limite = largura * altura * 4 + 1024 * 1024
  if (bytes.byteLength === 0 || bytes.byteLength > limite) {
    throw new ErroMotor('CODEC_UNAVAILABLE')
  }
  const png =
    bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8
  const webp =
    bytes.length > 12 &&
    String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === 'RIFF' &&
    String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === 'WEBP'
  const valido = formato === 'png' ? png : formato === 'jpeg' ? jpeg : webp
  if (!valido) throw new ErroMotor('CODEC_UNAVAILABLE')
}
