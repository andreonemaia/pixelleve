import { unzipSync } from 'fflate'
import { describe, expect, test } from 'vitest'
import { caminhoDeSaida, nomesUnicos, sanitizarCaminhoRelativo } from '../../src/core/caminhos'
import { aplicarCancelamento, contarFila, textoProgresso } from '../../src/core/fila'
import { esvaziarLeitor } from '../../src/importacao/esvaziarLeitor'
import { percorrerEntrada, type EntradaSistema } from '../../src/importacao/percorrerEntrada'
import { montarZip, selecionarParaZip } from '../../src/zip/montarZip'

describe('caminhos e fila', () => {
  test('preserva subpastas ao sanitizar', () => {
    expect(sanitizarCaminhoRelativo('fotos/ferias/praia final.png')).toBe('fotos/ferias/praia final.png')
    expect(sanitizarCaminhoRelativo('..\\fotos\\..\\secreto.png')).toBe('secreto.png')
    expect(caminhoDeSaida('fotos/ferias/praia final.png', 'webp')).toBe('fotos/ferias/praia final.webp')
  })

  test('desambigua nomes repetidos sem achatar pastas', () => {
    expect(nomesUnicos(['a/foto.webp', 'b/foto.webp', 'a/foto.webp'])).toEqual([
      'a/foto.webp',
      'b/foto.webp',
      'a/foto (2).webp',
    ])
  })

  test('cancelamento só marca o item em processamento', () => {
    const itens = aplicarCancelamento([
      { estado: 'aguardando' as const, mensagem: '', conclusao: 0 },
      { estado: 'processando' as const, mensagem: 'Comprimindo', conclusao: 0 },
      { estado: 'concluido' as const, mensagem: '', conclusao: 1 },
    ])
    expect(itens.map((item) => item.estado)).toEqual(['aguardando', 'cancelado', 'concluido'])
    const contagem = contarFila(
      itens.map((item) => item.estado),
      2,
    )
    expect(textoProgresso(contagem)).toBe('2 de 3 imagens concluídas')
    expect(contagem.aguardando).toBe(1)
    expect(contagem.cancelados).toBe(1)
    expect(contagem.ignorados).toBe(2)
  })

  test('esvazia o leitor além dos primeiros 100', async () => {
    const lotes = [Array.from({ length: 100 }, (_, indice) => indice), Array.from({ length: 20 }, (_, indice) => indice + 100), []]
    let cursor = 0
    const todos = await esvaziarLeitor(async () => lotes[cursor++] ?? [])
    expect(todos).toHaveLength(120)
    expect(todos[0]).toBe(0)
    expect(todos[119]).toBe(119)
  })

  test('percorre subpastas e mais de 100 arquivos', async () => {
    const arquivos = Array.from({ length: 105 }, (_, indice) => entradaArquivo(`f-${indice}.png`))
    const raiz: EntradaSistema = {
      isFile: false,
      isDirectory: true,
      name: 'raiz',
      lerArquivo: async () => {
        throw new Error('não é arquivo')
      },
      lerFilhos: async () => [
        {
          isFile: false,
          isDirectory: true,
          name: 'sub',
          lerArquivo: async () => {
            throw new Error('não é arquivo')
          },
          lerFilhos: async () => arquivos,
        },
      ],
    }
    const destino: { arquivo: File; caminhoRelativo: string }[] = []
    await percorrerEntrada(raiz, 'raiz', destino)
    expect(destino).toHaveLength(105)
    expect(destino[0]?.caminhoRelativo).toBe('raiz/sub/f-0.png')
    expect(destino[104]?.caminhoRelativo).toBe('raiz/sub/f-104.png')
  })
})

describe('zip', () => {
  test('mantém pastas, desambigua e recusa acima do limite', () => {
    const zip = montarZip([
      { caminho: 'sub/um/foto.png', bytes: Uint8Array.from([1, 2]) },
      { caminho: 'sub/dois/foto.png', bytes: Uint8Array.from([3, 4]) },
      { caminho: 'sub/um/foto.png', bytes: Uint8Array.from([5]) },
    ])
    expect(zip.ok).toBe(true)
    if (!zip.ok) return
    const aberto = unzipSync(zip.bytes)
    expect(Object.keys(aberto).sort()).toEqual(['sub/dois/foto.png', 'sub/um/foto (2).png', 'sub/um/foto.png'])
    expect(Array.from(aberto['sub/dois/foto.png'])).toEqual([3, 4])

    const recusado = montarZip([{ caminho: 'a.png', bytes: Uint8Array.from([1]) }], 0)
    expect(recusado.ok).toBe(false)
    if (!recusado.ok) expect(recusado.motivo).toBe('memoria')
  })

  test('deixa falha e cancelamento fora do arquivo', () => {
    const selecao = selecionarParaZip([
      {
        estado: 'concluido',
        caminhoRelativo: 'fotos/ok.png',
        resultado: { bytes: Uint8Array.from([9]).buffer, extensao: 'png' },
      },
      { estado: 'sem-reducao', caminhoRelativo: 'fotos/igual.png', resultado: { bytes: Uint8Array.from([8]).buffer, extensao: 'png' } },
      { estado: 'falha', caminhoRelativo: 'fotos/ruim.png' },
      { estado: 'cancelado', caminhoRelativo: 'fotos/parado.png' },
      { estado: 'aguardando', caminhoRelativo: 'fotos/espera.png' },
    ])
    expect(selecao.incluidos.map((item) => item.caminho)).toEqual(['fotos/ok.png', 'fotos/igual.png'])
    expect(selecao.excluidos.map((item) => item.motivo)).toEqual(['falha', 'cancelado', 'pendente'])
  })
})

function entradaArquivo(nome: string): EntradaSistema {
  return {
    isFile: true,
    isDirectory: false,
    name: nome,
    lerArquivo: async () => new File([new Uint8Array([1])], nome, { type: 'image/png' }),
    lerFilhos: async () => [],
  }
}
