import { useCallback, useEffect, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { lerLimiteOpcional, LIMITE_LADO, montarLimites } from '../core/dimensoes'
import type { FormatoSaida, Preset } from '../core/tipos'
import { contarFila, textoContagem, textoProgresso } from '../core/fila'
import { formatarPercentual } from '../core/metricas'
import { formatarTamanho, resumirLote, textoResumo, type ResumoLote } from '../core/tamanhos'
import { navegadorAceitaArrasteDePasta, navegadorAceitaPasta } from '../importacao/lerSoltura'
import { LIMITE_ZIP_BYTES, montarZip, selecionarParaZip } from '../zip/montarZip'
import { BarraAplicativo } from './BarraAplicativo'
import { ListaArquivos } from './ListaArquivos'
import { useFila, type ItemFila } from './usarFila'
import { caminhoDeSaida } from '../core/caminhos'
import { ehDesktop } from '../plataforma/ambiente'
import {
  bytesDaUrl,
  escolherImagensNativas,
  escolherPastaNativa,
  gravarResultadoNativo,
  iniciarPastaSaida,
  mensagemArquivo,
  salvarBytesNativo,
} from '../plataforma/nativo'

export function TelaLote() {
  const arquivoRef = useRef<HTMLInputElement>(null)
  const pastaRef = useRef<HTMLInputElement>(null)
  const focoRef = useRef<HTMLElement | null>(null)
  const fila = useFila()
  const [arrastando, setArrastando] = useState(false)
  const [aceitaPasta, setAceitaPasta] = useState(true)
  const [aceitaArraste, setAceitaArraste] = useState(true)
  const [avisoZip, setAvisoZip] = useState('')
  const [exportando, definirExportando] = useState(false)
  const desktop = ehDesktop()

  useEffect(() => {
    const pasta = pastaRef.current
    if (pasta) pasta.webkitdirectory = true
    setAceitaPasta(desktop || navegadorAceitaPasta())
    setAceitaArraste(navegadorAceitaArrasteDePasta())
  }, [desktop])

  const contagem = contarFila(
    fila.itens.map((item) => item.estado),
    fila.ignorados,
  )
  const pares = fila.itens
    .filter((item) => item.resultado && (item.estado === 'concluido' || item.estado === 'sem-reducao' || item.estado === 'maior'))
    .map((item) => ({
      bytesEntrada: item.resultado?.bytesEntrada ?? 0,
      bytesSaida: item.resultado?.bytesSaida ?? 0,
    }))
  const resumo = resumirLote(pares)
  const parcial = contagem.aguardando + contagem.processando > 0
  const pedeFundo = fila.formato === 'jpeg' && fila.itens.some((item) => item.inspecao?.possuiAlpha)
  const comFila = fila.itens.length > 0
  const prontos = fila.itens.filter(itemPronto)
  const selecionados = prontos.filter((item) => item.selecionado)
  const somaProntos = prontos.reduce((total, item) => total + (item.resultado?.bytesSaida ?? 0), 0)
  const limites = montarLimites({
    manterDimensoes: fila.manterDimensoes,
    textoLargura: fila.textoLargura,
    textoAltura: fila.textoAltura,
  })

  const definirComparandoId = fila.definirComparandoId
  const fecharComparacao = useCallback(() => {
    definirComparandoId(null)
    focoRef.current?.focus()
  }, [definirComparandoId])

  function aoSoltar(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault()
    setArrastando(false)
    const lista = evento.dataTransfer.items
    if (lista.length > 0 && typeof lista[0].webkitGetAsEntry === 'function') {
      void fila.importarArraste(lista)
      return
    }
    void fila.importarLista(evento.dataTransfer.files, false)
  }

  function baixarLote(origem: ItemFila[]) {
    definirExportando(true)
    if (desktop) {
      void salvarZip(origem).finally(() => definirExportando(false))
      return
    }
    try {
      montarDownload(origem)
    } finally {
      definirExportando(false)
    }
  }

  async function salvarZip(origem: ItemFila[]) {
    const selecao = selecionarParaZip(origem)
    const zip = montarZip(selecao.incluidos)
    if (!zip.ok) {
      setAvisoZip(
        zip.motivo === 'memoria'
          ? `O lote pronto passa de ${formatarTamanho(LIMITE_ZIP_BYTES)}. Selecione parte das imagens e use Baixar seleção.`
          : 'Não há imagens concluídas para o ZIP.',
      )
      return
    }
    const resultado = await salvarBytesNativo('pixelleve.zip', zip.bytes)
    if (resultado !== 'ok') {
      fila.avisar(mensagemArquivo(resultado, true))
      return
    }
    setAvisoZip(`ZIP com ${zip.caminhos.length} ${zip.caminhos.length === 1 ? 'arquivo' : 'arquivos'}.`)
  }

  async function aoEscolherImagens() {
    if (!desktop) {
      arquivoRef.current?.click()
      return
    }
    const resultado = await escolherImagensNativas((entrada) => fila.importarEntradas([entrada]))
    if (resultado !== 'ok') fila.avisar(mensagemArquivo(resultado, false))
  }

  async function aoEscolherPasta() {
    if (!desktop) {
      pastaRef.current?.click()
      return
    }
    const resultado = await escolherPastaNativa((entrada) => fila.importarEntradas([entrada]))
    if (resultado !== 'ok') fila.avisar(mensagemArquivo(resultado, false))
  }

  async function aoSalvarItem(item: ItemFila) {
    if (!item.resultado) return
    definirExportando(true)
    try {
      const nome = caminhoDeSaida(item.caminhoRelativo, item.resultado.extensao).split('/').pop() ?? 'imagem'
      const bytes = await bytesDaUrl(item.resultado.url)
      const resultado = await salvarBytesNativo(nome, bytes)
      fila.avisar(resultado === 'ok' ? `Salvo: ${nome}.` : mensagemArquivo(resultado, true))
    } finally {
      definirExportando(false)
    }
  }

  async function aoSalvarPasta(origem: ItemFila[]) {
    const prontosOrigem = origem.filter(itemPronto)
    if (prontosOrigem.length === 0) return
    definirExportando(true)
    try {
      const inicio = await iniciarPastaSaida()
      if (inicio !== 'ok') {
        fila.avisar(mensagemArquivo(inicio, true))
        return
      }
      const ocupados = new Set<string>()
      for (const item of prontosOrigem) {
        if (!item.resultado) continue
        const bytes = await bytesDaUrl(item.resultado.url)
        const resultado = await gravarResultadoNativo(
          caminhoDeSaida(item.caminhoRelativo, item.resultado.extensao),
          bytes,
          ocupados,
        )
        if (resultado !== 'ok') {
          fila.avisar(mensagemArquivo(resultado, true))
          return
        }
      }
      fila.avisar('Resultados salvos em pasta, sem alterar os originais.')
    } finally {
      definirExportando(false)
    }
  }

  function montarDownload(origem: ItemFila[]) {
    const selecao = selecionarParaZip(origem)
    const zip = montarZip(selecao.incluidos)
    if (!zip.ok) {
      setAvisoZip(
        zip.motivo === 'memoria'
          ? `O lote pronto passa de ${formatarTamanho(LIMITE_ZIP_BYTES)}. Selecione parte das imagens e use Baixar seleção.`
          : 'Não há imagens concluídas para o ZIP.',
      )
      return
    }
    const copia = new Uint8Array(zip.bytes.byteLength)
    copia.set(zip.bytes)
    const url = URL.createObjectURL(new Blob([copia], { type: 'application/zip' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'pixelleve.zip'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    const falhas = selecao.excluidos.filter((item) => item.motivo === 'falha')
    const cancelados = selecao.excluidos.filter((item) => item.motivo === 'cancelado')
    const partes = [`ZIP com ${zip.caminhos.length} ${zip.caminhos.length === 1 ? 'arquivo' : 'arquivos'}.`]
    if (falhas.length > 0) partes.push(`${falhas.length} ficaram de fora por falha: ${falhas.map((item) => item.caminho).join(', ')}.`)
    if (cancelados.length > 0) {
      partes.push(`${cancelados.length} ficaram de fora por cancelamento: ${cancelados.map((item) => item.caminho).join(', ')}.`)
    }
    setAvisoZip(partes.join(' '))
  }

  const loteComResultado = prontos.length > 0
  const classeEntrada = arrastando ? 'entrada arrastando' : comFila ? 'entrada compacta' : 'entrada'
  const textoLimites = textoDosLimites(fila.textoLargura, fila.textoAltura)

  return (
    <main className={comFila ? 'tela com-fila' : 'tela'}>
      <header className="cabecalho">
        <div>
          <p className="marca">PixelLeve</p>
          <h1>Imagens prontas para a web</h1>
        </div>
        <p className="local">Processamento no seu dispositivo</p>
      </header>
      <BarraAplicativo
        processando={fila.processando}
        exportando={exportando}
        quantidadeSessao={fila.itens.length}
      />

      <div className="miolo">
        <div className="coluna">
      <section
        className={classeEntrada}
        onDragOver={(evento) => {
          evento.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={aoSoltar}
      >
        <h2>{comFila ? 'Adicionar mais' : 'Adicionar imagens'}</h2>
        <p>{comFila ? 'Arraste mais arquivos ou escolha outra pasta.' : 'Arraste imagens ou uma pasta.'}</p>
        <div className="acoes-entrada">
          <button type="button" className={comFila ? undefined : 'principal'} onClick={() => void aoEscolherImagens()}>
            Escolher imagens
          </button>
          {aceitaPasta ? (
            <button type="button" onClick={() => void aoEscolherPasta()}>
              Escolher pasta
            </button>
          ) : null}
          <input
            ref={arquivoRef}
            id="arquivo"
            className="arquivo-oculto"
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp,.apng"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(evento) => {
              void fila.importarLista(evento.target.files, false)
              evento.target.value = ''
            }}
          />
          <input
            ref={pastaRef}
            id="pasta"
            className="arquivo-oculto"
            type="file"
            multiple
            aria-hidden="true"
            tabIndex={-1}
            onChange={(evento) => {
              void fila.importarLista(evento.target.files, true)
              evento.target.value = ''
            }}
          />
        </div>
        {!aceitaPasta ? (
          <p className="aviso">
            Este navegador não oferece seleção de pasta. Use Escolher imagens para selecionar vários arquivos.
          </p>
        ) : null}
        {!aceitaArraste ? (
          <p className="aviso">
            Arrastar pastas não está disponível neste navegador. Use Escolher imagens para selecionar vários arquivos.
          </p>
        ) : null}
        <p className="nota">
          PNG, JPEG e WebP estáticos. Até 40 MiB, 24 megapixels e {LIMITE_LADO.toLocaleString('pt-BR')} px de lado.
        </p>
      </section>

      <section className="resumo" data-teste="resumo">
        <div className="resumo-topo">
          <div>
            <p className="resumo-rotulo">{parcial ? 'Economia até agora' : 'Economia do lote'}</p>
            <p className={classeDoResumo(resumo.quantidade, resumo.economiaBytes)}>{textoDoResumo(resumo)}</p>
          </div>
        </div>
        <dl className="resumo-grade">
          <div>
            <dt>Original</dt>
            <dd>{resumo.quantidade > 0 ? formatarTamanho(resumo.bytesEntrada) : '—'}</dd>
          </div>
          <div>
            <dt>Final</dt>
            <dd>{resumo.quantidade > 0 ? formatarTamanho(resumo.bytesSaida) : '—'}</dd>
          </div>
          <div>
            <dt>Arquivos</dt>
            <dd>{contagem.total > 0 ? contagem.total.toLocaleString('pt-BR') : '—'}</dd>
          </div>
        </dl>
        {contagem.total > 0 ? (
          <p className="progresso" data-teste="progresso">
            {textoProgresso(contagem)}
          </p>
        ) : null}
        {contagem.total > 0 || contagem.ignorados > 0 ? (
          <p className="contagem" data-teste="contagem">
            {textoContagem(contagem)}
          </p>
        ) : null}
        <p className="status" role="status">
          {contagem.total > 0 ? `${textoResumo(resumo, parcial)}. ` : null}
          {fila.mensagem}
        </p>
        <div className="acoes-lote">
          <button
            type="button"
            className={loteComResultado ? undefined : 'principal'}
            onClick={() => void fila.comprimirLote()}
            disabled={contagem.aguardando === 0 || fila.processando || !limites.ok}
          >
            Comprimir lote
          </button>
          <button type="button" onClick={fila.cancelar} disabled={!fila.processando}>
            Cancelar
          </button>
          <button
            type="button"
            className={loteComResultado ? 'principal' : undefined}
            onClick={() => baixarLote(fila.itens)}
            disabled={prontos.length === 0 || somaProntos > LIMITE_ZIP_BYTES}
          >
            {desktop ? 'Salvar lote em ZIP' : 'Baixar lote em ZIP'}
          </button>
          <button
            type="button"
            onClick={() => baixarLote(fila.itens.filter((item) => item.selecionado))}
            disabled={selecionados.length === 0}
          >
            {desktop ? 'Salvar seleção' : 'Baixar seleção'}
          </button>
          {desktop ? (
            <button type="button" onClick={() => void aoSalvarPasta(prontos)} disabled={prontos.length === 0}>
              Salvar em pasta
            </button>
          ) : null}
          <button type="button" onClick={fila.limpar} disabled={fila.itens.length === 0 || fila.processando}>
            Limpar
          </button>
        </div>
        {somaProntos > LIMITE_ZIP_BYTES ? (
          <p className="aviso">
            O lote pronto passa de {formatarTamanho(LIMITE_ZIP_BYTES)}. Selecione parte das imagens e use Baixar
            seleção.
          </p>
        ) : null}
        {avisoZip ? <p className="aviso-zip">{avisoZip}</p> : null}
      </section>

      <ListaArquivos
        itens={fila.itens}
        comparandoId={fila.comparandoId}
        aoComparar={(id, origem) => {
          focoRef.current = origem
          fila.definirComparandoId(id)
        }}
        aoFecharComparacao={fecharComparacao}
        aoRemover={fila.remover}
        aoTentarNovamente={fila.tentarNovamente}
        aoAlternarSelecao={fila.alternarSelecao}
        aoSalvar={desktop ? (item) => void aoSalvarItem(item) : undefined}
      />
        </div>
        <aside className="lateral">
          <section className="painel" aria-label="Configuração">
            <h2>Configuração</h2>
            <div className="grupo-config">
              <label className="campo">
                Formato de saída
                <select
                  id="formato"
                  value={fila.formato}
                  onChange={(evento) => fila.definirFormato(evento.target.value as FormatoSaida)}
                >
                  <option value="original">Manter formato</option>
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </label>
              <label className="campo">
                Preset
                <select id="preset" value={fila.preset} onChange={(evento) => fila.definirPreset(evento.target.value as Preset)}>
                  <option value="leve">Leve</option>
                  <option value="equilibrado">Equilibrado</option>
                  <option value="maxima">Máxima redução</option>
                </select>
              </label>
            </div>
            <p className="micro">{textoQualidade(fila.formato)}</p>
            <fieldset className="dimensoes">
              <legend>Redimensionar</legend>
              <label className="campo campo-check">
                <input
                  id="manter-dimensoes"
                  type="checkbox"
                  checked={fila.manterDimensoes}
                  onChange={(evento) => fila.definirManterDimensoes(evento.target.checked)}
                />
                Manter dimensões originais
              </label>
              {fila.manterDimensoes ? <p className="micro">{textoLimites}</p> : null}
              <div className={fila.manterDimensoes ? 'campos-limite inativos' : 'campos-limite'}>
                <label className="campo">
                  Largura máxima
                  <input
                    id="largura-maxima"
                    type="text"
                    inputMode="numeric"
                    value={fila.textoLargura}
                    aria-invalid={!fila.manterDimensoes && !lerLimiteOpcional(fila.textoLargura, 'largura').ok}
                    onChange={(evento) => fila.definirTextoLargura(evento.target.value)}
                  />
                </label>
                <label className="campo">
                  Altura máxima
                  <input
                    id="altura-maxima"
                    type="text"
                    inputMode="numeric"
                    value={fila.textoAltura}
                    aria-invalid={!fila.manterDimensoes && !lerLimiteOpcional(fila.textoAltura, 'altura').ok}
                    onChange={(evento) => fila.definirTextoAltura(evento.target.value)}
                  />
                </label>
              </div>
            </fieldset>
            {pedeFundo ? (
              <label className="campo">
                Cor de fundo
                <input
                  id="fundo"
                  type="color"
                  value={fila.fundo || '#ffffff'}
                  onChange={(evento) => fila.definirFundo(evento.target.value)}
                />
              </label>
            ) : null}
            {pedeFundo ? <p className="aviso">JPEG não guarda transparência. Escolha a cor que substitui o fundo.</p> : null}
            {!limites.ok ? <p className="aviso" role="alert">{limites.mensagem}</p> : null}
            <details className="como-funciona">
              <summary>Como funciona</summary>
              <p>A proporção é mantida e imagens menores não são ampliadas. Com largura e altura, a imagem cabe nos dois sem recorte.</p>
              <p>Enquanto “Manter dimensões originais” estiver marcado, os limites ficam guardados e não entram no processamento.</p>
              <p>Escolher uma pasta não altera os arquivos originais. Cada nova compressão usa o arquivo de entrada.</p>
            </details>
          </section>
        </aside>
      </div>
    </main>
  )
}

function itemPronto(item: ItemFila): boolean {
  return Boolean(item.resultado) && (item.estado === 'concluido' || item.estado === 'sem-reducao' || item.estado === 'maior')
}

function textoDoResumo(resumo: ResumoLote): string {
  if (resumo.quantidade === 0) return 'A economia aparece quando houver imagens concluídas.'
  if (resumo.economiaBytes > 0) {
    return `Economizou ${formatarTamanho(resumo.economiaBytes)} · ${formatarPercentual(resumo.percentual)}`
  }
  if (resumo.economiaBytes < 0) {
    return `Aumentou ${formatarTamanho(Math.abs(resumo.economiaBytes))} · ${formatarPercentual(Math.abs(resumo.percentual))}`
  }
  return 'Economia zero'
}

function classeDoResumo(quantidade: number, economiaBytes: number): string {
  if (quantidade === 0) return 'resumo-valor resumo-vazio'
  if (economiaBytes < 0) return 'resumo-valor resumo-aumento'
  if (economiaBytes === 0) return 'resumo-valor resumo-neutro'
  return 'resumo-valor'
}

function textoQualidade(formato: FormatoSaida): string {
  if (formato === 'png') return 'PNG sem perdas preserva os pixels. O preset muda o esforço, não a aparência.'
  if (formato === 'jpeg' || formato === 'webp') return 'JPEG e WebP neste preset usam perdas. A imagem pode mudar.'
  return 'PNG sem perdas preserva os pixels. JPEG e WebP podem alterar a imagem.'
}

function textoDosLimites(largura: string, altura: string): string {
  if (!largura && !altura) return 'Nenhum limite informado. Os valores ficam guardados ao serem preenchidos.'
  const partes = []
  if (largura) partes.push(`largura ${largura} px`)
  if (altura) partes.push(`altura ${altura} px`)
  return `Limites guardados: ${partes.join(', ')}.`
}
