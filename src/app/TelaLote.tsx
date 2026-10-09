import { useEffect, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import type { FormatoSaida, Preset } from '../core/tipos'
import { contarFila, textoContagem, textoProgresso } from '../core/fila'
import { formatarPercentual } from '../core/metricas'
import { formatarTamanho, resumirLote, textoResumo } from '../core/tamanhos'
import { navegadorAceitaArrasteDePasta, navegadorAceitaPasta } from '../importacao/lerSoltura'
import { LIMITE_ZIP_BYTES, montarZip, selecionarParaZip } from '../zip/montarZip'
import { ListaArquivos } from './ListaArquivos'
import { useFila, type ItemFila } from './usarFila'

export function TelaLote() {
  const arquivoRef = useRef<HTMLInputElement>(null)
  const pastaRef = useRef<HTMLInputElement>(null)
  const focoRef = useRef<HTMLElement | null>(null)
  const fila = useFila()
  const [arrastando, setArrastando] = useState(false)
  const [aceitaPasta, setAceitaPasta] = useState(true)
  const [aceitaArraste, setAceitaArraste] = useState(true)
  const [avisoZip, setAvisoZip] = useState('')

  useEffect(() => {
    const pasta = pastaRef.current
    if (pasta) pasta.webkitdirectory = true
    setAceitaPasta(navegadorAceitaPasta())
    setAceitaArraste(navegadorAceitaArrasteDePasta())
  }, [])

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
  const prontos = fila.itens.filter(itemPronto)
  const selecionados = prontos.filter((item) => item.selecionado)
  const somaProntos = prontos.reduce((total, item) => total + (item.resultado?.bytesSaida ?? 0), 0)

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

  return (
    <main className="tela">
      <header className="cabecalho">
        <div>
          <p className="marca">PixelLeve</p>
          <h1>Imagens prontas para a web</h1>
        </div>
        <p className="local">Processamento no seu dispositivo</p>
      </header>

      <section
        className={arrastando ? 'entrada arrastando' : 'entrada'}
        onDragOver={(evento) => {
          evento.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={aoSoltar}
      >
        <h2>Adicionar imagens</h2>
        <p>Arraste imagens ou uma pasta. Escolher uma pasta não altera os arquivos originais.</p>
        <div className="acoes-entrada">
          <button type="button" onClick={() => arquivoRef.current?.click()}>
            Escolher imagens
          </button>
          {aceitaPasta ? (
            <button type="button" onClick={() => pastaRef.current?.click()}>
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
        <p className="nota">PNG, JPEG e WebP estáticos. Até 40 MiB e 24 megapixels por imagem.</p>
      </section>

      <section className="painel">
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
        <p className="nota">
          {fila.formato === 'png'
            ? 'PNG sem perdas preserva os pixels. O preset muda o esforço da otimização, não a qualidade visual.'
            : fila.formato === 'jpeg' || fila.formato === 'webp'
              ? 'JPEG e WebP neste preset usam perdas. A qualidade visual pode mudar.'
              : 'PNG sem perdas preserva os pixels. JPEG e WebP podem alterar a imagem.'}
        </p>
      </section>

      <section className="resumo" data-teste="resumo">
        <div className="resumo-topo">
          <div>
            <p className="resumo-rotulo">{parcial ? 'Economia até agora' : 'Economia do lote'}</p>
            {resumo.quantidade > 0 ? (
              <p className={resumo.economiaBytes < 0 ? 'resumo-valor resumo-aumento' : 'resumo-valor'}>
                {resumo.economiaBytes === 0
                  ? 'Economia zero'
                  : `${resumo.economiaBytes > 0 ? 'Economizou ' : 'Aumentou '}${formatarTamanho(Math.abs(resumo.economiaBytes))}`}
              </p>
            ) : (
              <p className="resumo-detalhe">A economia aparece quando houver imagens concluídas.</p>
            )}
          </div>
          {resumo.quantidade > 0 ? (
            <p className={resumo.economiaBytes < 0 ? 'resumo-valor resumo-aumento' : 'resumo-valor'}>
              {formatarPercentual(Math.abs(resumo.percentual))}
            </p>
          ) : null}
        </div>
        {resumo.quantidade > 0 ? (
          <p className="resumo-detalhe">
            {resumo.quantidade === 1 ? '1 imagem' : `${resumo.quantidade} imagens`} ·{' '}
            {formatarTamanho(resumo.bytesEntrada)} → {formatarTamanho(resumo.bytesSaida)}
          </p>
        ) : null}
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
            className="principal"
            onClick={() => void fila.comprimirLote()}
            disabled={contagem.aguardando === 0 || fila.processando}
          >
            Comprimir lote
          </button>
          <button type="button" onClick={fila.cancelar} disabled={!fila.processando}>
            Cancelar
          </button>
          <button type="button" onClick={() => baixarLote(fila.itens)} disabled={prontos.length === 0 || somaProntos > LIMITE_ZIP_BYTES}>
            Baixar lote em ZIP
          </button>
          <button
            type="button"
            onClick={() => baixarLote(fila.itens.filter((item) => item.selecionado))}
            disabled={selecionados.length === 0}
          >
            Baixar seleção
          </button>
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
        aoFecharComparacao={() => {
          fila.definirComparandoId(null)
          focoRef.current?.focus()
        }}
        aoRemover={fila.remover}
        aoTentarNovamente={fila.tentarNovamente}
        aoAlternarSelecao={fila.alternarSelecao}
      />
    </main>
  )
}

function itemPronto(item: ItemFila): boolean {
  return Boolean(item.resultado) && (item.estado === 'concluido' || item.estado === 'sem-reducao' || item.estado === 'maior')
}
