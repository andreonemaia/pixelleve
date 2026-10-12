import { invoke } from '@tauri-apps/api/core'
import { proximoNomeLivre } from '../core/caminhos'
import { LIMITE_BYTES } from '../core/inspecionar'
import { pareceImagemAceita } from '../importacao/classificar'
import type { EntradaImportada } from '../importacao/percorrerEntrada'

export interface ArquivoListado {
  caminho: string
  relativo: string
  tamanho: number
}

export type CodigoArquivo =
  | 'cancelado'
  | 'sem-permissao'
  | 'caminho-invalido'
  | 'fora-da-pasta'
  | 'original-protegido'
  | 'grande'
  | 'falha'

export function mensagemArquivo(codigo: string, salvando: boolean): string {
  if (codigo === 'cancelado') return salvando ? 'Salvamento cancelado.' : 'Seleção cancelada.'
  if (codigo === 'sem-permissao') return 'Não foi possível acessar este local. Verifique a permissão da pasta.'
  if (codigo === 'fora-da-pasta') return 'O caminho saiu da pasta escolhida.'
  if (codigo === 'caminho-invalido') return 'O caminho não é válido.'
  if (codigo === 'original-protegido') return 'O arquivo original não foi alterado. Escolha outro nome.'
  if (codigo === 'grande') return 'O arquivo passa de 40 MiB.'
  return 'Não foi possível concluir a operação de arquivo.'
}

export async function escolherImagensNativas(
  publicar: (entrada: EntradaImportada) => Promise<void>,
): Promise<CodigoArquivo | 'ok'> {
  return importarLista('escolher_imagens', publicar)
}

export async function escolherPastaNativa(
  publicar: (entrada: EntradaImportada) => Promise<void>,
): Promise<CodigoArquivo | 'ok'> {
  return importarLista('escolher_pasta', publicar)
}

export async function salvarBytesNativo(nome: string, bytes: Uint8Array): Promise<CodigoArquivo | 'ok'> {
  try {
    const salvo = await invoke<string | null>('salvar_arquivo', bytes, {
      headers: { nome: encodeURIComponent(nome) },
    })
    return salvo === null ? 'cancelado' : 'ok'
  } catch (erro) {
    return codigoDoErro(erro)
  }
}

export async function iniciarPastaSaida(): Promise<CodigoArquivo | 'ok'> {
  try {
    const pasta = await invoke<string | null>('escolher_pasta_saida')
    return pasta === null ? 'cancelado' : 'ok'
  } catch (erro) {
    return codigoDoErro(erro)
  }
}

export async function gravarResultadoNativo(
  relativo: string,
  bytes: Uint8Array,
  ocupados: Set<string>,
): Promise<CodigoArquivo | 'ok'> {
  const livre = proximoNomeLivre(relativo, (candidato) => ocupados.has(candidato.toLowerCase()))
  ocupados.add(livre.toLowerCase())
  try {
    await invoke('gravar_resultado', bytes, {
      headers: { relativo: encodeURIComponent(livre) },
    })
    return 'ok'
  } catch (erro) {
    return codigoDoErro(erro)
  }
}

async function importarLista(
  comando: 'escolher_imagens' | 'escolher_pasta',
  publicar: (entrada: EntradaImportada) => Promise<void>,
): Promise<CodigoArquivo | 'ok'> {
  let lista: ArquivoListado[] | null
  try {
    lista = await invoke<ArquivoListado[] | null>(comando)
  } catch (erro) {
    return codigoDoErro(erro)
  }
  if (lista === null) return 'cancelado'
  for (const item of lista) {
    const nome = item.relativo.split('/').pop() || 'imagem'
    if (!pareceImagemAceita(nome, '')) {
      await publicar({
        arquivo: new File([], nome),
        caminhoRelativo: item.relativo,
        tamanho: item.tamanho,
      })
      continue
    }
    if (item.tamanho > LIMITE_BYTES) {
      await publicar({
        arquivo: new File([], nome),
        caminhoRelativo: item.relativo,
        tamanho: item.tamanho,
      })
      continue
    }
    try {
      const buffer = await invoke<ArrayBuffer>('ler_arquivo', { caminho: item.caminho })
      const bytes = new Uint8Array(buffer)
      await publicar({
        arquivo: new File([bytes], nome, { type: tipoPeloNome(nome) }),
        caminhoRelativo: item.relativo,
      })
    } catch (erro) {
      return codigoDoErro(erro)
    }
  }
  return 'ok'
}

function tipoPeloNome(nome: string): string {
  const extensao = nome.split('.').pop()?.toLowerCase() ?? ''
  if (extensao === 'jpg' || extensao === 'jpeg') return 'image/jpeg'
  if (extensao === 'webp') return 'image/webp'
  return 'image/png'
}

function codigoDoErro(erro: unknown): CodigoArquivo {
  const texto = typeof erro === 'string' ? erro : erro instanceof Error ? erro.message : ''
  if (texto.includes('cancelado')) return 'cancelado'
  if (texto.includes('sem-permissao')) return 'sem-permissao'
  if (texto.includes('fora-da-pasta')) return 'fora-da-pasta'
  if (texto.includes('caminho-invalido')) return 'caminho-invalido'
  if (texto.includes('original-protegido')) return 'original-protegido'
  if (texto.includes('grande')) return 'grande'
  return 'falha'
}

export async function bytesDaUrl(url: string): Promise<Uint8Array> {
  const resposta = await fetch(url)
  return new Uint8Array(await resposta.arrayBuffer())
}
