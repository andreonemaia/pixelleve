import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { descreverEconomia, formatarBytes } from '../core/metricas'
import { nomeDeSaida } from '../core/nomes'
import { descricaoFormato, inspecionarImagem } from '../core/inspecionar'
import type { FormatoSaida, InspecaoImagem, Preset, SaidaMotor } from '../core/tipos'

interface Sessao {
  nome: string
  bytes: ArrayBuffer
  inspecao: InspecaoImagem
  urlOriginal: string
}

interface SaidaVisivel {
  url: string
  nome: string
  mime: string
  bytesSaida: number
  largura: number
  altura: number
  usouOriginal: boolean
  avisos: string[]
  duracaoMs: number
  economia: string
  revisao: number
}

interface RespostaResultado extends SaidaMotor {
  tipo: 'resultado'
  jobId: string
  revisao: number
  duracaoMs: number
}

interface RespostaErro {
  tipo: 'erro'
  jobId: string
  revisao: number
  codigo: string
  mensagem: string
}

export function TelaProva() {
  const workerRef = useRef<Worker | null>(null)
  const revisaoRef = useRef(0)
  const urlsRef = useRef<string[]>([])
  const sessaoRef = useRef<Sessao | null>(null)
  const [sessao, setSessao] = useState<Sessao | null>(null)
  const [formato, setFormato] = useState<FormatoSaida>('original')
  const [preset, setPreset] = useState<Preset>('equilibrado')
  const [fundo, setFundo] = useState('')
  const [processando, setProcessando] = useState(false)
  const [saida, setSaida] = useState<SaidaVisivel | null>(null)
  const [mensagem, setMensagem] = useState('Escolha uma imagem PNG, JPEG ou WebP.')

  useEffect(() => {
    const worker = new Worker(new URL('../workers/processar.worker.ts', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker
    worker.onmessage = (evento: MessageEvent<RespostaResultado | RespostaErro>) => {
      const resposta = evento.data
      if (resposta.revisao !== revisaoRef.current) return
      setProcessando(false)
      if (resposta.tipo === 'erro') {
        setSaida(null)
        setMensagem(resposta.mensagem)
        return
      }
      const url = URL.createObjectURL(new Blob([resposta.bytes], { type: resposta.mime }))
      urlsRef.current.push(url)
      setSaida({
        url,
        nome: nomeDeSaida(sessaoRef.current?.nome ?? 'imagem', resposta.extensao),
        mime: resposta.mime,
        bytesSaida: resposta.bytesSaida,
        largura: resposta.largura,
        altura: resposta.altura,
        usouOriginal: resposta.usouOriginal,
        avisos: resposta.avisos,
        duracaoMs: resposta.duracaoMs,
        economia: descreverEconomia(resposta.bytesEntrada, resposta.bytesSaida, resposta.usouOriginal),
        revisao: resposta.revisao,
      })
      setMensagem(
        resposta.usouOriginal
          ? 'Já estava otimizada'
          : descreverEconomia(resposta.bytesEntrada, resposta.bytesSaida, false),
      )
    }
    const urls = urlsRef.current
    return () => {
      worker.terminate()
      workerRef.current = null
      for (const url of urls) URL.revokeObjectURL(url)
    }
  }, [])

  sessaoRef.current = sessao

  async function aoSelecionarArquivo(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!arquivo) return

    revisaoRef.current += 1
    setProcessando(false)
    setSaida(null)
    const bytes = await arquivo.arrayBuffer()
    const inspecao = inspecionarImagem(new Uint8Array(bytes))
    if (!inspecao.ok) {
      liberarSessao()
      setSessao(null)
      setMensagem(inspecao.erro.mensagem)
      return
    }

    const urlOriginal = URL.createObjectURL(arquivo)
    urlsRef.current.push(urlOriginal)
    setSessao({
      nome: arquivo.name,
      bytes,
      inspecao: inspecao.inspecao,
      urlOriginal,
    })
    setMensagem('Imagem pronta para processar.')
  }

  function aoProcessar() {
    const atual = sessaoRef.current
    const worker = workerRef.current
    if (!atual || !worker || processando) return
    if (formato === 'jpeg' && atual.inspecao.possuiAlpha && !/^#[0-9a-fA-F]{6}$/.test(fundo)) {
      setMensagem('JPEG não guarda transparência. Escolha uma cor de fundo antes de converter.')
      return
    }

    revisaoRef.current += 1
    setProcessando(true)
    setSaida(null)
    setMensagem('Otimizando imagem')
    const copia = atual.bytes.slice(0)
    worker.postMessage(
      {
        tipo: 'processar',
        jobId: crypto.randomUUID(),
        revisao: revisaoRef.current,
        opcoes: {
          formato,
          preset,
          fundoJpeg: fundo || undefined,
        },
        bytes: copia,
      },
      [copia],
    )
  }

  function liberarSessao() {
    if (!sessaoRef.current) return
    URL.revokeObjectURL(sessaoRef.current.urlOriginal)
  }

  const pedeFundo = formato === 'jpeg' && sessao?.inspecao.possuiAlpha === true
  const formatoEfetivo = formato === 'original' ? sessao?.inspecao.formato : formato

  return (
    <main className="tela">
      <header className="cabecalho">
        <div>
          <p className="marca">PixelLeve</p>
          <h1>Imagens prontas para a web</h1>
        </div>
        <p className="selo">Processamento no seu dispositivo</p>
      </header>

      <p className="aviso-etapa">
        Prova técnica da etapa 0. Esta tela ainda não é o aplicativo completo.
      </p>

      <section className="painel">
        <label className="escolha">
          Escolher imagem
          <input
            id="arquivo"
            type="file"
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            onChange={(evento) => {
              void aoSelecionarArquivo(evento)
            }}
          />
        </label>

        <label>
          Formato de saída
          <select
            id="formato"
            value={formato}
            onChange={(evento) => setFormato(evento.target.value as FormatoSaida)}
          >
            <option value="original">Manter formato</option>
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
        </label>

        <label>
          Preset
          <select
            id="preset"
            value={preset}
            onChange={(evento) => setPreset(evento.target.value as Preset)}
          >
            <option value="leve">Leve</option>
            <option value="equilibrado">Equilibrado</option>
            <option value="maxima">Máxima redução</option>
          </select>
        </label>

        {pedeFundo ? (
          <label>
            Cor de fundo
            <input
              id="fundo"
              type="color"
              value={fundo || '#ffffff'}
              onChange={(evento) => setFundo(evento.target.value)}
            />
          </label>
        ) : null}

        <button type="button" onClick={aoProcessar} disabled={!sessao || processando}>
          Processar
        </button>
      </section>

      <p className="nota-preset">
        {formatoEfetivo === 'png'
          ? 'PNG sem perdas preserva os pixels. O preset muda o esforço da otimização, não a qualidade visual.'
          : formatoEfetivo === 'jpeg' || formatoEfetivo === 'webp'
            ? 'JPEG e WebP neste preset usam perdas. A qualidade visual pode mudar.'
            : 'PNG sem perdas preserva os pixels. JPEG e WebP podem alterar a imagem.'}
      </p>

      <p className="status" data-teste="status" role="status">
        {mensagem}
      </p>

      {sessao ? (
        <p className="resumo">
          {sessao.nome} · {descricaoFormato(sessao.inspecao.formato)} · {sessao.inspecao.largura}×
          {sessao.inspecao.altura}
          {sessao.inspecao.possuiAlpha ? ' · com transparência' : ''}
        </p>
      ) : null}

      <section className="previews">
        <figure>
          <figcaption>Original</figcaption>
          {sessao ? (
            <img data-teste="original" src={sessao.urlOriginal} alt="Pré-visualização da imagem original" />
          ) : (
            <div className="vazio">Nenhuma imagem selecionada</div>
          )}
          <p data-teste="bytes-entrada" data-bytes={sessao?.bytes.byteLength ?? 0}>
            {sessao ? formatarBytes(sessao.bytes.byteLength) : '—'}
          </p>
        </figure>
        <figure>
          <figcaption>Resultado</figcaption>
          {saida ? (
            <img
              data-teste="resultado"
              data-revisao={saida.revisao}
              src={saida.url}
              alt="Pré-visualização da imagem processada"
            />
          ) : (
            <div className="vazio">{processando ? 'Processando' : 'Aguardando processamento'}</div>
          )}
          <p data-teste="bytes-saida" data-bytes={saida?.bytesSaida ?? 0}>
            {saida ? formatarBytes(saida.bytesSaida) : '—'}
          </p>
        </figure>
      </section>

      {saida ? (
        <section className="resultado" data-teste="painel-resultado">
          <p data-teste="economia">{saida.economia}</p>
          <p data-teste="dimensoes">
            {saida.largura}×{saida.altura} · {saida.mime}
          </p>
          <p data-teste="duracao">{saida.duracaoMs} ms</p>
          {saida.avisos.map((aviso) => (
            <p key={aviso}>{aviso}</p>
          ))}
          <a data-teste="baixar" href={saida.url} download={saida.nome}>
            Baixar resultado
          </a>
        </section>
      ) : null}
    </main>
  )
}
