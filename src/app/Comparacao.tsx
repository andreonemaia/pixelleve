import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { caminhoDeSaida, partirCaminho } from '../core/caminhos'
import { descreverEscalas } from '../core/dimensoes'
import { descricaoFormato } from '../core/inspecionar'
import { formatarPercentual } from '../core/metricas'
import { descreverPar, formatarTamanho } from '../core/tamanhos'
import type { ItemFila } from './usarFila'

interface ComparacaoProps {
  item: ItemFila
  aoFechar: () => void
  aoSalvar?: () => void
}

interface Deslocamento {
  x: number
  y: number
}

export function Comparacao({ item, aoFechar, aoSalvar }: ComparacaoProps) {
  const fecharRef = useRef<HTMLButtonElement>(null)
  const vistaRef = useRef<HTMLDivElement>(null)
  const deslocamentoRef = useRef<Deslocamento>({ x: 0, y: 0 })
  const [urlOriginal, setUrlOriginal] = useState('')
  const [posicao, definirPosicao] = useState(50)
  const [modo, definirModo] = useState<'ajustar' | 'pixels' | 'manual'>('ajustar')
  const [manual, definirManual] = useState(1)
  const [ajuste, definirAjuste] = useState(1)
  const [deslocamento, definirDeslocamento] = useState<Deslocamento>({ x: 0, y: 0 })
  const partes = partirCaminho(item.caminhoRelativo)
  const nomeBaixar = item.resultado
    ? (caminhoDeSaida(item.caminhoRelativo, item.resultado.extensao).split('/').pop() ?? item.arquivo.name)
    : item.arquivo.name
  const larguraOriginal = item.inspecao?.largura ?? 0
  const alturaOriginal = item.inspecao?.altura ?? 0
  const larguraResultado = item.resultado?.largura ?? larguraOriginal
  const alturaResultado = item.resultado?.altura ?? alturaOriginal
  const escala = modo === 'pixels' ? 1 : modo === 'manual' ? manual : ajuste

  useEffect(() => {
    const url = URL.createObjectURL(item.arquivo)
    setUrlOriginal(url)
    return () => URL.revokeObjectURL(url)
  }, [item.arquivo])

  useEffect(() => {
    fecharRef.current?.focus()
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') aoFechar()
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aoFechar])

  useEffect(() => {
    const vista = vistaRef.current
    if (!vista || larguraOriginal <= 0 || alturaOriginal <= 0) return
    const medir = () => {
      const proxima = Math.min(vista.clientWidth / larguraOriginal, vista.clientHeight / alturaOriginal)
      definirAjuste(proxima > 0 && Number.isFinite(proxima) ? proxima : 1)
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(vista)
    return () => observador.disconnect()
  }, [larguraOriginal, alturaOriginal])

  function zerarDeslocamento() {
    deslocamentoRef.current = { x: 0, y: 0 }
    definirDeslocamento({ x: 0, y: 0 })
  }

  function definirEscala(proxima: 'ajustar' | 'pixels') {
    definirModo(proxima)
    zerarDeslocamento()
  }

  function alterarZoom(fator: number) {
    const proxima = Math.min(8, Math.max(0.25, escala * fator))
    definirModo('manual')
    definirManual(proxima)
    zerarDeslocamento()
  }

  function aoPressionar(evento: ReactPointerEvent<HTMLDivElement>) {
    if (evento.button !== 0) return
    const alvo = evento.currentTarget
    alvo.setPointerCapture(evento.pointerId)
    const origemX = evento.clientX
    const origemY = evento.clientY
    const baseX = deslocamentoRef.current.x
    const baseY = deslocamentoRef.current.y
    const aoMover = (ev: PointerEvent) => {
      const proximo = { x: baseX + ev.clientX - origemX, y: baseY + ev.clientY - origemY }
      deslocamentoRef.current = proximo
      definirDeslocamento(proximo)
    }
    const aoSoltar = (ev: PointerEvent) => {
      alvo.removeEventListener('pointermove', aoMover)
      alvo.removeEventListener('pointerup', aoSoltar)
      if (alvo.hasPointerCapture(ev.pointerId)) alvo.releasePointerCapture(ev.pointerId)
    }
    alvo.addEventListener('pointermove', aoMover)
    alvo.addEventListener('pointerup', aoSoltar)
  }

  const nota =
    larguraOriginal > 0 && alturaOriginal > 0 && item.resultado
      ? descreverEscalas(larguraOriginal, alturaOriginal, larguraResultado, alturaResultado)
      : ''

  return (
    <div className="comparacao-fundo">
      <section
        className="comparacao"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-comparacao"
      >
        <div className="comparacao-cabeca">
          <h2 id="titulo-comparacao">Comparar {partes.nome}</h2>
          <button ref={fecharRef} type="button" onClick={aoFechar}>
            Fechar
          </button>
        </div>
        <p className="meta">
          {partes.pasta || 'Pasta atual'}
          {item.inspecao
            ? ` · ${descricaoFormato(item.inspecao.formato)} · ${item.inspecao.largura}×${item.inspecao.altura}`
            : ''}
        </p>
        <div
          ref={vistaRef}
          className="comparacao-vista"
          data-teste="vista"
          onPointerDown={aoPressionar}
        >
          {urlOriginal && larguraOriginal > 0 ? (
            <div
              className="comparacao-cena"
              data-teste="cena"
              data-escala={escala}
              data-deslocamento={`${deslocamento.x},${deslocamento.y}`}
              style={{
                width: larguraOriginal * escala,
                height: alturaOriginal * escala,
                transform: `translate(${deslocamento.x}px, ${deslocamento.y}px)`,
              }}
            >
              <img
                data-teste="original"
                src={urlOriginal}
                alt={`Original de ${partes.nome}`}
                style={{ width: larguraOriginal * escala, height: alturaOriginal * escala }}
              />
              {item.resultado ? (
                <div className="comparacao-recorte" style={{ width: `${posicao}%` }}>
                  <img
                    data-teste="resultado"
                    src={item.resultado.url}
                    alt={`Resultado de ${partes.nome}`}
                    style={{ width: larguraResultado * escala, height: alturaResultado * escala }}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        {item.resultado ? (
          <label className="campo slider-campo">
            Posição da comparação
            <input
              className="slider"
              data-teste="slider"
              type="range"
              min={0}
              max={100}
              step={1}
              value={posicao}
              aria-valuetext={`${posicao}% do resultado sobre o original`}
              onChange={(evento) => definirPosicao(Number(evento.target.value))}
            />
          </label>
        ) : (
          <p>{item.mensagem || 'Esta imagem ainda não foi comprimida.'}</p>
        )}
        <div className="comparacao-controles">
          <button type="button" onClick={() => definirPosicao(0)} disabled={!item.resultado}>
            Ver original
          </button>
          <button type="button" onClick={() => definirPosicao(100)} disabled={!item.resultado}>
            Ver resultado
          </button>
          <button type="button" onClick={() => definirEscala('ajustar')}>
            Ajustar à tela
          </button>
          <button type="button" onClick={() => definirEscala('pixels')}>
            100%
          </button>
          <button type="button" onClick={() => alterarZoom(0.5)}>
            Reduzir
          </button>
          <button type="button" onClick={() => alterarZoom(2)}>
            Ampliar
          </button>
        </div>
        <p data-teste="exibicao">Exibição em {formatarPercentual(escala * 100)}</p>
        {nota ? <p data-teste="nota-escala">{nota}</p> : null}
        <p className="meta">
          Original · {formatarTamanho(item.arquivo.size)}
          {item.resultado ? ` · Resultado · ${formatarTamanho(item.resultado.bytesSaida)}` : ''}
        </p>
        {item.resultado ? (
          <p>{descreverPar(item.resultado.bytesEntrada, item.resultado.bytesSaida, item.resultado.usouOriginal)}</p>
        ) : null}
        {item.resultado?.avisos.map((aviso) => (
          <p key={aviso}>{aviso}</p>
        ))}
        {item.resultado ? (
          aoSalvar ? (
            <button type="button" onClick={aoSalvar}>
              Salvar esta imagem
            </button>
          ) : (
            <a className="acao" href={item.resultado.url} download={nomeBaixar}>
              Baixar esta imagem
            </a>
          )
        ) : null}
      </section>
    </div>
  )
}
