export type FormatoImagem = 'jpeg' | 'png' | 'webp'

export type FormatoSaida = 'original' | FormatoImagem

export type Preset = 'leve' | 'equilibrado' | 'maxima'

export type ReferenciaDimensao = 'largura' | 'altura'

export type PedidoDimensao =
  | { modo: 'nenhum' }
  | { modo: 'proporcional'; referencia: 'largura'; largura: number }
  | { modo: 'proporcional'; referencia: 'altura'; altura: number }
  | { modo: 'exato'; largura: number; altura: number }

export type CodigoErro =
  | 'UNSUPPORTED_FORMAT'
  | 'ANIMATED_INPUT'
  | 'INVALID_IMAGE'
  | 'TOO_LARGE'
  | 'ALPHA_BACKGROUND_REQUIRED'
  | 'CODEC_UNAVAILABLE'
  | 'OUT_OF_MEMORY'
  | 'EXPORT_FAILED'
  | 'AMPLIACAO_RECUSADA'

export interface OpcoesProcessamento {
  formato: FormatoSaida
  preset: Preset
  fundoJpeg?: string
  pedidoDimensao: PedidoDimensao
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
