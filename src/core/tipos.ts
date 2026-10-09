export type FormatoImagem = 'jpeg' | 'png' | 'webp'

export type FormatoSaida = 'original' | FormatoImagem

export type Preset = 'leve' | 'equilibrado' | 'maxima'

export type CodigoErro =
  | 'UNSUPPORTED_FORMAT'
  | 'ANIMATED_INPUT'
  | 'INVALID_IMAGE'
  | 'TOO_LARGE'
  | 'ALPHA_BACKGROUND_REQUIRED'
  | 'CODEC_UNAVAILABLE'
  | 'OUT_OF_MEMORY'
  | 'EXPORT_FAILED'

export interface OpcoesProcessamento {
  formato: FormatoSaida
  preset: Preset
  fundoJpeg?: string
  larguraMaxima?: number
  alturaMaxima?: number
  ampliar?: boolean
}

export interface InspecaoImagem {
  formato: FormatoImagem
  largura: number
  altura: number
  possuiAlpha: boolean
}

export interface ErroProcessamento {
  codigo: CodigoErro
  mensagem: string
}

export interface SaidaMotor {
  bytes: ArrayBuffer
  mime: string
  extensao: string
  largura: number
  altura: number
  bytesEntrada: number
  bytesSaida: number
  usouOriginal: boolean
  avisos: string[]
}

export interface ResultadoInspecao {
  ok: true
  inspecao: InspecaoImagem
}

export interface FalhaInspecao {
  ok: false
  erro: ErroProcessamento
}
