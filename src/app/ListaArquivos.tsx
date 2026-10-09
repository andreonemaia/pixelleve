import { caminhoDeSaida, partirCaminho } from '../core/caminhos'
import type { EstadoItem } from '../core/fila'
import { descricaoFormato } from '../core/inspecionar'
import { descreverPar, formatarTamanho } from '../core/tamanhos'
import { Comparacao } from './Comparacao'
import { Miniatura } from './Miniatura'
import type { ItemFila } from './usarFila'

interface ListaArquivosProps {
  itens: ItemFila[]
  comparandoId: string | null
  aoComparar: (id: string, origem: HTMLElement) => void
  aoFecharComparacao: () => void
  aoRemover: (id: string) => void
  aoTentarNovamente: (id: string) => void
  aoAlternarSelecao: (id: string) => void
}

export function ListaArquivos({
  itens,
  comparandoId,
  aoComparar,
  aoFecharComparacao,
  aoRemover,
  aoTentarNovamente,
  aoAlternarSelecao,
}: ListaArquivosProps) {
  const comparando = itens.find((item) => item.id === comparandoId) ?? null

  return (
    <section className="lista">
      <h2>Arquivos</h2>
      {itens.length === 0 ? <p className="vazio-lista">Nenhuma imagem na fila.</p> : null}
      {itens.map((item) => {
        const partes = partirCaminho(item.caminhoRelativo)
        const nomeBaixar = item.resultado
          ? (caminhoDeSaida(item.caminhoRelativo, item.resultado.extensao).split('/').pop() ?? partes.nome)
          : partes.nome
        return (
          <article
            key={item.id}
            className="linha"
            data-teste="linha"
            data-estado={item.estado}
            data-conclusao={item.conclusao}
            data-caminho={item.caminhoRelativo}
            data-bytes-entrada={item.arquivo.size}
            data-bytes-saida={item.resultado?.bytesSaida}
            data-largura-saida={item.resultado?.largura}
            data-altura-saida={item.resultado?.altura}
          >
            <input
              type="checkbox"
              checked={item.selecionado}
              aria-label={`Selecionar ${partes.nome}`}
              onChange={() => aoAlternarSelecao(item.id)}
            />
            <button
              type="button"
              className="abrir"
              onClick={(evento) => aoComparar(item.id, evento.currentTarget)}
            >
              <Miniatura arquivo={item.arquivo} />
              <span>
                <span className="nome">{partes.nome}</span>
                {partes.pasta ? <span className="caminho">{partes.pasta}</span> : null}
                <span className="meta">
                  {formatarTamanho(item.arquivo.size)}
                  {item.inspecao
                    ? ` · ${descricaoFormato(item.inspecao.formato)} · ${item.inspecao.largura}×${item.inspecao.altura}`
                    : ''}
                </span>
              </span>
            </button>
            <div>
              {item.resultado ? (
                <span className="economia-item">
                  {descreverPar(item.resultado.bytesEntrada, item.resultado.bytesSaida, item.resultado.usouOriginal)}
                </span>
              ) : (
                <span className="economia-item">{item.mensagem || 'Aguardando compressão'}</span>
              )}
              <p className={classeEstado(item.estado)}>{rotuloEstado(item.estado)}</p>
              {item.resultado ? (
                <span data-teste="duracao">{item.resultado.duracaoMs} ms</span>
              ) : null}
              {item.inspecao || item.resultado ? (
                <span
                  data-teste="dimensoes"
                  data-largura-saida={item.resultado?.largura}
                  data-altura-saida={item.resultado?.altura}
                >
                  {item.inspecao ? `${item.inspecao.largura}×${item.inspecao.altura}` : ''}
                  {item.resultado
                    ? `${item.inspecao ? ' → ' : ''}${item.resultado.largura}×${item.resultado.altura} · ${item.resultado.mime}`
                    : ''}
                </span>
              ) : null}
              {item.resultado?.usouOriginal ? <span className="meta">Já estava otimizada</span> : null}
            </div>
            <div className="acoes-linha">
              <button type="button" onClick={(evento) => aoComparar(item.id, evento.currentTarget)}>
                Comparar
              </button>
              {item.resultado ? (
                <a data-teste="baixar" className="acao" href={item.resultado.url} download={nomeBaixar}>
                  Baixar
                </a>
              ) : null}
              {item.estado !== 'aguardando' && item.estado !== 'processando' ? (
                <button type="button" onClick={() => aoTentarNovamente(item.id)}>
                  Tentar novamente
                </button>
              ) : null}
              <button type="button" onClick={() => aoRemover(item.id)} disabled={item.estado === 'processando'}>
                Remover
              </button>
            </div>
          </article>
        )
      })}
      {comparando ? <Comparacao item={comparando} aoFechar={aoFecharComparacao} /> : null}
    </section>
  )
}

function rotuloEstado(estado: EstadoItem): string {
  switch (estado) {
    case 'aguardando':
      return 'Aguardando'
    case 'processando':
      return 'Comprimindo'
    case 'concluido':
      return 'Concluída'
    case 'sem-reducao':
      return 'Já estava otimizada'
    case 'maior':
      return 'Ficou maior'
    case 'falha':
      return 'Falhou'
    case 'cancelado':
      return 'Cancelado'
  }
}

function classeEstado(estado: EstadoItem): string {
  if (estado === 'falha' || estado === 'maior') return 'estado estado-falha'
  if (estado === 'cancelado') return 'estado estado-cancelado'
  if (estado === 'concluido' || estado === 'sem-reducao') return 'estado estado-ok'
  return 'estado'
}
