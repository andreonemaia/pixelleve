import { zipSync } from 'fflate'
import { caminhoDeSaida, nomesUnicos, sanitizarCaminhoRelativo } from '../core/caminhos'
import type { EstadoItem } from '../core/fila'

export const LIMITE_ZIP_BYTES = 256 * 1024 * 1024

export interface ArquivoZip {
  caminho: string
  bytes: Uint8Array
}

export interface ItemExportavel {
  estado: EstadoItem
  caminhoRelativo: string
  resultado?: {
    bytes: ArrayBuffer
    extensao: string
  }
}

export type ZipMontado =
  | { ok: true; bytes: Uint8Array; caminhos: string[] }
  | { ok: false; motivo: 'vazio' | 'memoria'; bytes: number }

export function montarZip(arquivos: readonly ArquivoZip[], limite = LIMITE_ZIP_BYTES): ZipMontado {
  if (arquivos.length === 0) return { ok: false, motivo: 'vazio', bytes: 0 }
  let soma = 0
  for (const arquivo of arquivos) soma += arquivo.bytes.byteLength
  if (soma > limite) return { ok: false, motivo: 'memoria', bytes: soma }
  const caminhos = nomesUnicos(arquivos.map((arquivo) => sanitizarCaminhoRelativo(arquivo.caminho)))
  const mapa: Record<string, Uint8Array> = {}
  arquivos.forEach((arquivo, indice) => {
    mapa[caminhos[indice]] = arquivo.bytes
  })
  return { ok: true, bytes: zipSync(mapa, { level: 0 }), caminhos }
}

export function selecionarParaZip(itens: readonly ItemExportavel[]): {
  incluidos: ArquivoZip[]
  excluidos: { caminho: string; motivo: 'falha' | 'cancelado' | 'pendente' }[]
} {
  const incluidos: ArquivoZip[] = []
  const excluidos: { caminho: string; motivo: 'falha' | 'cancelado' | 'pendente' }[] = []
  for (const item of itens) {
    if (item.estado === 'falha') {
      excluidos.push({ caminho: item.caminhoRelativo, motivo: 'falha' })
      continue
    }
    if (item.estado === 'cancelado') {
      excluidos.push({ caminho: item.caminhoRelativo, motivo: 'cancelado' })
      continue
    }
    const pronto = item.estado === 'concluido' || item.estado === 'sem-reducao' || item.estado === 'maior'
    if (!pronto || !item.resultado) {
      excluidos.push({ caminho: item.caminhoRelativo, motivo: 'pendente' })
      continue
    }
    incluidos.push({
      caminho: caminhoDeSaida(item.caminhoRelativo, item.resultado.extensao),
      bytes: new Uint8Array(item.resultado.bytes),
    })
  }
  return { incluidos, excluidos }
}
