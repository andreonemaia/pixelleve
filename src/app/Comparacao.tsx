import { useEffect, useRef, useState } from 'react'
import { caminhoDeSaida, partirCaminho } from '../core/caminhos'
import { descricaoFormato } from '../core/inspecionar'
import { descreverPar, formatarTamanho } from '../core/tamanhos'
import type { ItemFila } from './usarFila'

interface ComparacaoProps {
  item: ItemFila
  aoFechar: () => void
}

export function Comparacao({ item, aoFechar }: ComparacaoProps) {
  const fecharRef = useRef<HTMLButtonElement>(null)
  const [urlOriginal, setUrlOriginal] = useState('')
  const partes = partirCaminho(item.caminhoRelativo)
  const nomeBaixar = item.resultado
    ? (caminhoDeSaida(item.caminhoRelativo, item.resultado.extensao).split('/').pop() ?? item.arquivo.name)
    : item.arquivo.name

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
        <div className="comparacao-grade">
          <figure className="quadro">
            <figcaption>Original · {formatarTamanho(item.arquivo.size)}</figcaption>
            {urlOriginal ? (
              <img data-teste="original" src={urlOriginal} alt={`Original de ${partes.nome}`} />
            ) : null}
          </figure>
          <figure className="quadro">
            <figcaption>
              Resultado
              {item.resultado ? ` · ${formatarTamanho(item.resultado.bytesSaida)}` : ''}
            </figcaption>
            {item.resultado ? (
              <img data-teste="resultado" src={item.resultado.url} alt={`Resultado de ${partes.nome}`} />
            ) : (
              <p>{item.mensagem || 'Esta imagem ainda não foi comprimida.'}</p>
            )}
          </figure>
        </div>
        {item.resultado ? (
          <p>{descreverPar(item.resultado.bytesEntrada, item.resultado.bytesSaida, item.resultado.usouOriginal)}</p>
        ) : null}
        {item.resultado?.avisos.map((aviso) => (
          <p key={aviso}>{aviso}</p>
        ))}
        {item.resultado ? (
          <a className="acao" href={item.resultado.url} download={nomeBaixar}>
            Baixar esta imagem
          </a>
        ) : null}
      </section>
    </div>
  )
}
