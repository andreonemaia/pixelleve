import { LIMITE_BYTES, inspecionarImagem } from '../core/inspecionar'
import { mensagemDoCodigo } from '../core/mensagens'
import type { InspecaoImagem } from '../core/tipos'

const EXTENSOES = new Set(['png', 'jpg', 'jpeg', 'webp', 'apng'])

export type ClassificacaoArquivo =
  | { tipo: 'ignorado' }
  | { tipo: 'fila'; estado: 'aguardando'; inspecao: InspecaoImagem }
  | { tipo: 'fila'; estado: 'falha'; mensagem: string }

export function extensaoDeNome(nome: string): string {
  const base = nome.split(/[/\\]/).pop() ?? nome
  const ponto = base.lastIndexOf('.')
  return ponto >= 0 ? base.slice(ponto + 1).toLowerCase() : ''
}

export function pareceImagemAceita(nome: string, tipo: string): boolean {
  if (EXTENSOES.has(extensaoDeNome(nome))) return true
  return tipo === 'image/png' || tipo === 'image/jpeg' || tipo === 'image/webp'
}

export function classificarArquivo(
  nome: string,
  tipo: string,
  tamanho: number,
  bytes: Uint8Array | null,
): ClassificacaoArquivo {
  if (!pareceImagemAceita(nome, tipo)) return { tipo: 'ignorado' }
  if (tamanho <= 0) return { tipo: 'fila', estado: 'falha', mensagem: mensagemDoCodigo('INVALID_IMAGE') }
  if (tamanho > LIMITE_BYTES) return { tipo: 'fila', estado: 'falha', mensagem: mensagemDoCodigo('TOO_LARGE') }
  if (!bytes) return { tipo: 'fila', estado: 'falha', mensagem: mensagemDoCodigo('INVALID_IMAGE') }
  const resultado = inspecionarImagem(bytes)
  if (!resultado.ok) return { tipo: 'fila', estado: 'falha', mensagem: resultado.erro.mensagem }
  return { tipo: 'fila', estado: 'aguardando', inspecao: resultado.inspecao }
}
