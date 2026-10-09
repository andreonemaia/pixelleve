import { useCallback, useEffect, useRef, useState } from 'react'
import { fundoValido } from '../core/alpha'
import { montarLimites } from '../core/dimensoes'
import { estadoDeResultado, type EstadoItem } from '../core/fila'
import { mensagemDoCodigo } from '../core/mensagens'
import { descreverPar } from '../core/tamanhos'
import type { FormatoSaida, InspecaoImagem, Preset } from '../core/tipos'
import { classificarArquivo, pareceImagemAceita } from '../importacao/classificar'
import { LIMITE_BYTES } from '../core/inspecionar'
import { coletarDoArraste, entradasDeLista } from '../importacao/lerSoltura'
import type { EntradaImportada } from '../importacao/percorrerEntrada'
import type { PedidoProcessamento, RespostaWorker } from '../workers/protocolo'

export interface ResultadoItem {
  bytes: ArrayBuffer
  mime: string
  extensao: string
  largura: number
  altura: number
  bytesEntrada: number
  bytesSaida: number
  usouOriginal: boolean
  avisos: string[]
  duracaoMs: number
  url: string
}

export interface ItemFila {
  id: string
  revisao: number
  conclusao: number
  arquivo: File
  caminhoRelativo: string
  selecionado: boolean
  inspecao?: InspecaoImagem
  estado: EstadoItem
  mensagem: string
  resultado?: ResultadoItem
}

interface Pendente {
  resolve: (resposta: RespostaWorker) => void
  reject: (erro: Error) => void
}

export function useFila() {
  const workerRef = useRef<Worker | null>(null)
  const pendenteRef = useRef<Pendente | null>(null)
  const itensRef = useRef<ItemFila[]>([])
  const cancelarRef = useRef(false)
  const executandoRef = useRef(false)
  const seguirDepoisRef = useRef(false)
  const geracaoRef = useRef(0)
  const importacaoRef = useRef(Promise.resolve())
  const opcoesRef = useRef({
    formato: 'original' as FormatoSaida,
    preset: 'equilibrado' as Preset,
    fundo: '',
    manterDimensoes: true,
    textoLargura: '',
    textoAltura: '',
  })
  const [itens, setItens] = useState<ItemFila[]>([])
  const [ignorados, setIgnorados] = useState(0)
  const [mensagem, setMensagem] = useState('Escolha imagens ou uma pasta. Os originais não são alterados.')
  const [processando, setProcessando] = useState(false)
  const [formato, definirFormato] = useState<FormatoSaida>('original')
  const [preset, definirPreset] = useState<Preset>('equilibrado')
  const [fundo, definirFundo] = useState('')
  const [manterDimensoes, definirManterDimensoes] = useState(true)
  const [textoLargura, definirTextoLargura] = useState('')
  const [textoAltura, definirTextoAltura] = useState('')
  const [comparandoId, definirComparandoId] = useState<string | null>(null)

  opcoesRef.current = { formato, preset, fundo, manterDimensoes, textoLargura, textoAltura }

  const definirItens = useCallback((proximo: ItemFila[] | ((atual: ItemFila[]) => ItemFila[])) => {
    const valor = typeof proximo === 'function' ? proximo(itensRef.current) : proximo
    itensRef.current = valor
    setItens(valor)
  }, [])

  const criarWorker = useCallback(() => {
    const geracao = geracaoRef.current + 1
    geracaoRef.current = geracao
    const worker = new Worker(new URL('../workers/processar.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (evento: MessageEvent<RespostaWorker>) => {
      if (geracao !== geracaoRef.current) return
      const pendente = pendenteRef.current
      if (!pendente) return
      pendenteRef.current = null
      pendente.resolve(evento.data)
    }
    worker.onerror = () => {
      if (geracao !== geracaoRef.current) return
      const pendente = pendenteRef.current
      if (!pendente) return
      pendenteRef.current = null
      pendente.reject(new Error('worker'))
    }
    return worker
  }, [])

  useEffect(() => {
    const worker = criarWorker()
    workerRef.current = worker
    return () => {
      worker.terminate()
      if (workerRef.current && workerRef.current !== worker) workerRef.current.terminate()
      workerRef.current = null
    }
  }, [criarWorker])

  const atualizar = useCallback(
    (id: string, revisao: number, mudar: (item: ItemFila) => ItemFila) => {
      definirItens((atual) =>
        atual.map((item) => (item.id === id && item.revisao === revisao ? mudar(item) : item)),
      )
    },
    [definirItens],
  )

  const processarUm = useCallback(
    async (item: ItemFila) => {
      const revisao = item.revisao
      const limites = montarLimites(opcoesRef.current)
      if (!limites.ok) {
        setMensagem(limites.mensagem)
        return
      }
      const opcoes = {
        formato: opcoesRef.current.formato,
        preset: opcoesRef.current.preset,
        fundoJpeg: fundoValido(opcoesRef.current.fundo) ? opcoesRef.current.fundo : undefined,
        larguraMaxima: limites.larguraMaxima,
        alturaMaxima: limites.alturaMaxima,
        ampliar: limites.ampliar,
      }
      if (opcoes.formato === 'jpeg' && item.inspecao?.possuiAlpha && !opcoes.fundoJpeg) {
        const texto = mensagemDoCodigo('ALPHA_BACKGROUND_REQUIRED')
        atualizar(item.id, revisao, (atual) => ({
          ...atual,
          estado: 'falha',
          mensagem: texto,
          conclusao: atual.conclusao + 1,
        }))
        setMensagem(texto)
        return
      }

      atualizar(item.id, revisao, (atual) => ({ ...atual, estado: 'processando', mensagem: 'Comprimindo' }))
      try {
        const bytes = await item.arquivo.arrayBuffer()
        if (cancelarRef.current) return
        const pedido: PedidoProcessamento = {
          tipo: 'processar',
          jobId: item.id,
          revisao,
          opcoes,
          bytes,
        }
        const worker = workerRef.current
        if (!worker) throw new Error('worker')
        const resposta = await new Promise<RespostaWorker>((resolve, reject) => {
          pendenteRef.current = { resolve, reject }
          worker.postMessage(pedido, [pedido.bytes])
        })
        if (cancelarRef.current) return
        if (resposta.jobId !== item.id || resposta.revisao !== revisao) {
          atualizar(item.id, revisao, (atual) =>
            atual.estado === 'processando'
              ? {
                  ...atual,
                  estado: 'falha',
                  mensagem: 'O resultado chegou fora de ordem.',
                  conclusao: atual.conclusao + 1,
                }
              : atual,
          )
          return
        }
        const vigente = itensRef.current.find((candidato) => candidato.id === item.id)
        if (!vigente || vigente.revisao !== revisao || vigente.estado !== 'processando') return
        if (resposta.tipo === 'erro') {
          const texto = resposta.mensagem
          atualizar(item.id, revisao, (atual) => ({
            ...atual,
            estado: 'falha',
            mensagem: texto,
            conclusao: atual.conclusao + 1,
          }))
          setMensagem(texto)
          return
        }
        const url = URL.createObjectURL(new Blob([resposta.bytes], { type: resposta.mime }))
        const estado = estadoDeResultado(resposta.bytesEntrada, resposta.bytesSaida, resposta.usouOriginal)
        const texto = resposta.usouOriginal
          ? 'Já estava otimizada'
          : descreverPar(resposta.bytesEntrada, resposta.bytesSaida, false)
        atualizar(item.id, revisao, (atual) => {
          if (atual.resultado) URL.revokeObjectURL(atual.resultado.url)
          return {
            ...atual,
            estado,
            mensagem: texto,
            conclusao: atual.conclusao + 1,
            resultado: {
              bytes: resposta.bytes,
              mime: resposta.mime,
              extensao: resposta.extensao,
              largura: resposta.largura,
              altura: resposta.altura,
              bytesEntrada: resposta.bytesEntrada,
              bytesSaida: resposta.bytesSaida,
              usouOriginal: resposta.usouOriginal,
              avisos: resposta.avisos,
              duracaoMs: resposta.duracaoMs,
              url,
            },
          }
        })
        setMensagem(texto || 'Imagem concluída')
      } catch {
        if (cancelarRef.current) return
        const texto = mensagemDoCodigo('CODEC_UNAVAILABLE')
        atualizar(item.id, revisao, (atual) => ({
          ...atual,
          estado: 'falha',
          mensagem: texto,
          conclusao: atual.conclusao + 1,
        }))
        setMensagem(texto)
      }
    },
    [atualizar],
  )

  const comprimirLote = useCallback(async () => {
    if (executandoRef.current) {
      seguirDepoisRef.current = true
      return
    }
    const limitesIniciais = montarLimites(opcoesRef.current)
    if (!limitesIniciais.ok) {
      setMensagem(limitesIniciais.mensagem)
      return
    }
    executandoRef.current = true
    cancelarRef.current = false
    setProcessando(true)
    try {
      while (!cancelarRef.current) {
        const limites = montarLimites(opcoesRef.current)
        if (!limites.ok) {
          setMensagem(limites.mensagem)
          break
        }
        const proximo = itensRef.current.find((item) => item.estado === 'aguardando')
        if (!proximo) break
        await processarUm(proximo)
      }
    } finally {
      executandoRef.current = false
      const seguir = seguirDepoisRef.current
      seguirDepoisRef.current = false
      setProcessando(false)
      if (seguir) void comprimirLote()
    }
  }, [processarUm])

  const importarEntradas = useCallback(
    (entradas: EntradaImportada[]) => {
      importacaoRef.current = importacaoRef.current.then(async () => {
        const novos: ItemFila[] = []
        let ignoradosNovos = 0
        setMensagem('Lendo arquivos…')
        for (const entrada of entradas) {
          const arquivo = entrada.arquivo
          if (!pareceImagemAceita(arquivo.name, arquivo.type)) {
            ignoradosNovos += 1
            continue
          }
          const tamanho = entrada.tamanho ?? arquivo.size
          let bytes: Uint8Array | null = null
          if (tamanho > 0 && tamanho <= LIMITE_BYTES && arquivo.size > 0) {
            bytes = new Uint8Array(await arquivo.arrayBuffer())
          }
          const classe = classificarArquivo(arquivo.name, arquivo.type, tamanho, bytes)
          if (classe.tipo === 'ignorado') {
            ignoradosNovos += 1
            continue
          }
          novos.push({
            id: crypto.randomUUID(),
            revisao: 1,
            conclusao: classe.estado === 'falha' ? 1 : 0,
            arquivo,
            caminhoRelativo: entrada.caminhoRelativo || arquivo.name,
            selecionado: false,
            inspecao: classe.estado === 'aguardando' ? classe.inspecao : undefined,
            estado: classe.estado,
            mensagem: classe.estado === 'falha' ? classe.mensagem : '',
          })
        }
        if (ignoradosNovos > 0) setIgnorados((atual) => atual + ignoradosNovos)
        if (novos.length > 0) definirItens((atual) => [...atual, ...novos])
        const falha = [...novos].reverse().find((item) => item.estado === 'falha')
        if (falha) setMensagem(falha.mensagem)
        else if (novos.length === 0 && ignoradosNovos > 0) {
          setMensagem(
            ignoradosNovos === 1
              ? '1 arquivo incompatível foi ignorado.'
              : `${ignoradosNovos} arquivos incompatíveis foram ignorados.`,
          )
        } else if (novos.length === 0) setMensagem('Nenhuma imagem encontrada.')
        else {
          const total = itensRef.current.length
          setMensagem(total === 1 ? '1 imagem na fila.' : `${total} imagens na fila.`)
        }
      })
      return importacaoRef.current
    },
    [definirItens],
  )

  const importarLista = useCallback(
    (lista: FileList | null, usarCaminho: boolean) => {
      if (!lista || lista.length === 0) return Promise.resolve()
      return importarEntradas(entradasDeLista(lista, usarCaminho))
    },
    [importarEntradas],
  )

  const importarArraste = useCallback(
    (lista: DataTransferItemList) => {
      return coletarDoArraste(lista).then((entradas) => importarEntradas(entradas))
    },
    [importarEntradas],
  )

  const cancelar = useCallback(() => {
    cancelarRef.current = true
    seguirDepoisRef.current = false
    const pendente = pendenteRef.current
    pendenteRef.current = null
    pendente?.reject(new Error('cancelado'))
    workerRef.current?.terminate()
    const worker = criarWorker()
    workerRef.current = worker
    definirItens((atual) =>
      atual.map((item) =>
        item.estado === 'processando'
          ? { ...item, estado: 'cancelado', mensagem: 'Cancelado', conclusao: item.conclusao + 1 }
          : item,
      ),
    )
    setMensagem('Processamento cancelado. As imagens aguardando continuam na fila.')
    setProcessando(false)
  }, [criarWorker, definirItens])

  const remover = useCallback(
    (id: string) => {
      const item = itensRef.current.find((candidato) => candidato.id === id)
      if (item?.resultado) URL.revokeObjectURL(item.resultado.url)
      definirItens((atual) => atual.filter((candidato) => candidato.id !== id))
      definirComparandoId((atual) => (atual === id ? null : atual))
    },
    [definirItens],
  )

  const tentarNovamente = useCallback(
    (id: string) => {
      definirItens((atual) =>
        atual.map((item) => {
          if (item.id !== id || item.estado === 'processando') return item
          if (item.resultado) URL.revokeObjectURL(item.resultado.url)
          return {
            ...item,
            revisao: item.revisao + 1,
            estado: 'aguardando',
            mensagem: '',
            resultado: undefined,
          }
        }),
      )
      void comprimirLote()
    },
    [comprimirLote, definirItens],
  )

  const limpar = useCallback(() => {
    for (const item of itensRef.current) {
      if (item.resultado) URL.revokeObjectURL(item.resultado.url)
    }
    definirItens([])
    setIgnorados(0)
    definirComparandoId(null)
    setMensagem('Escolha imagens ou uma pasta. Os originais não são alterados.')
  }, [definirItens])

  const alternarSelecao = useCallback(
    (id: string) => {
      definirItens((atual) =>
        atual.map((item) => (item.id === id ? { ...item, selecionado: !item.selecionado } : item)),
      )
    },
    [definirItens],
  )

  const avisar = useCallback((texto: string) => {
    setMensagem(texto)
  }, [])

  useEffect(() => {
    return () => {
      for (const item of itensRef.current) {
        if (item.resultado) URL.revokeObjectURL(item.resultado.url)
      }
    }
  }, [])

  return {
    itens,
    ignorados,
    mensagem,
    processando,
    formato,
    definirFormato,
    preset,
    definirPreset,
    fundo,
    definirFundo,
    manterDimensoes,
    definirManterDimensoes,
    textoLargura,
    definirTextoLargura,
    textoAltura,
    definirTextoAltura,
    comparandoId,
    definirComparandoId,
    importarLista,
    importarArraste,
    comprimirLote,
    cancelar,
    remover,
    tentarNovamente,
    limpar,
    alternarSelecao,
    importarEntradas,
    avisar,
  }
}
