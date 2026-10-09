import decodeJpeg, { init as iniciarDecodeJpeg } from '@jsquash/jpeg/decode'
import mozjpegEnc from '@jsquash/jpeg/codec/enc/mozjpeg_enc.js'
import wasmJpegDec from '@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm?url'
import wasmJpegEnc from '@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm?url'
import { defaultEncodeOptions as opcoesPadraoJpeg } from '@jsquash/jpeg/meta.js'
import { initEmscriptenModule as iniciarModuloJpeg } from '@jsquash/jpeg/utils.js'
import iniciarOxipng, { optimise as optimizarBytesPng } from '@jsquash/oxipng/codec/pkg/squoosh_oxipng.js'
import wasmOxipng from '@jsquash/oxipng/codec/pkg/squoosh_oxipng_bg.wasm?url'
import decodePng, { init as iniciarDecodePng } from '@jsquash/png/decode'
import encodePng, { init as iniciarEncodePng } from '@jsquash/png/encode'
import wasmPng from '@jsquash/png/codec/pkg/squoosh_png_bg.wasm?url'
import webpEnc from '@jsquash/webp/codec/enc/webp_enc.js'
import webpEncSimd from '@jsquash/webp/codec/enc/webp_enc_simd.js'
import wasmWebpDec from '@jsquash/webp/codec/dec/webp_dec.wasm?url'
import wasmWebpEnc from '@jsquash/webp/codec/enc/webp_enc.wasm?url'
import wasmWebpEncSimd from '@jsquash/webp/codec/enc/webp_enc_simd.wasm?url'
import decodeWebp, { init as iniciarDecodeWebp } from '@jsquash/webp/decode'
import { defaultOptions as opcoesPadraoWebp } from '@jsquash/webp/meta.js'
import { initEmscriptenModule as iniciarModuloWebp } from '@jsquash/webp/utils.js'
import { simd } from 'wasm-feature-detect'
import type { MozJPEGModule } from '@jsquash/jpeg/codec/enc/mozjpeg_enc.js'
import type { WebPModule } from '@jsquash/webp/codec/enc/webp_enc.js'
import { ErroMotor } from '../core/erros'
import type { FormatoImagem } from '../core/tipos'

let codecsProntos: Promise<void> | undefined
let moduloJpeg: Promise<MozJPEGModule> | undefined
let moduloWebp: Promise<WebPModule> | undefined

export function iniciarCodecs(): Promise<void> {
  if (!codecsProntos) {
    codecsProntos = carregarCodecs().catch((erro: unknown) => {
      codecsProntos = undefined
      moduloJpeg = undefined
      moduloWebp = undefined
      throw erro
    })
  }
  return codecsProntos
}

async function carregarCodecs(): Promise<void> {
  await iniciarDecodeJpeg({ locateFile: () => wasmJpegDec })
  await iniciarDecodeWebp({ locateFile: () => wasmWebpDec })
  await iniciarDecodePng(wasmPng)
  await iniciarEncodePng(wasmPng)
  moduloJpeg = iniciarModuloJpeg(mozjpegEnc, undefined, {
    locateFile: () => wasmJpegEnc,
  })
  const usarSimd = await simd()
  moduloWebp = iniciarModuloWebp(usarSimd ? webpEncSimd : webpEnc, undefined, {
    locateFile: () => (usarSimd ? wasmWebpEncSimd : wasmWebpEnc),
  })
  await moduloJpeg
  await moduloWebp
  await iniciarOxipng(wasmOxipng)
}

export async function decodificarImagem(formato: FormatoImagem, bytes: Uint8Array): Promise<ImageData> {
  await iniciarCodecs()
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  const imagem =
    formato === 'jpeg'
      ? await decodeJpeg(buffer, { preserveOrientation: true })
      : formato === 'png'
        ? await decodePng(buffer)
        : await decodeWebp(buffer)
  if (!imagem || imagem.width <= 0 || imagem.height <= 0) {
    throw new ErroMotor('INVALID_IMAGE')
  }
  return new ImageData(new Uint8ClampedArray(imagem.data), imagem.width, imagem.height)
}

export async function codificarJpeg(imagem: ImageData, qualidade: number): Promise<Uint8Array> {
  await iniciarCodecs()
  const modulo = await moduloJpeg
  if (!modulo) throw new ErroMotor('CODEC_UNAVAILABLE')
  const visao = modulo.encode(imagem.data, imagem.width, imagem.height, {
    ...opcoesPadraoJpeg,
    quality: qualidade,
    chroma_quality: qualidade,
  })
  if (!visao || visao.byteLength === 0) throw new ErroMotor('CODEC_UNAVAILABLE')
  return visao.slice()
}

export async function codificarWebp(imagem: ImageData, qualidade: number): Promise<Uint8Array> {
  await iniciarCodecs()
  const modulo = await moduloWebp
  if (!modulo) throw new ErroMotor('CODEC_UNAVAILABLE')
  const visao = modulo.encode(imagem.data, imagem.width, imagem.height, {
    ...opcoesPadraoWebp,
    quality: qualidade,
    alpha_quality: 100,
    alpha_compression: 1,
    lossless: 0,
  })
  if (!visao || visao.byteLength === 0) throw new ErroMotor('CODEC_UNAVAILABLE')
  return visao.slice()
}

export async function codificarPng(imagem: ImageData): Promise<Uint8Array> {
  await iniciarCodecs()
  const buffer = await encodePng(imagem)
  if (!buffer || buffer.byteLength === 0) throw new ErroMotor('CODEC_UNAVAILABLE')
  return new Uint8Array(buffer).slice()
}

export async function otimizarPng(bytes: Uint8Array, nivel: number): Promise<Uint8Array> {
  await iniciarCodecs()
  const saida = optimizarBytesPng(bytes, nivel, false, false)
  if (!saida || saida.byteLength === 0) throw new ErroMotor('CODEC_UNAVAILABLE')
  return saida.slice()
}
