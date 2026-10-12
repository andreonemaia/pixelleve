import { formatarPercentual } from './metricas'
import type { CodigoErro, PedidoDimensao, ReferenciaDimensao } from './tipos'

export const LIMITE_LADO = 16_384

export type { PedidoDimensao, ReferenciaDimensao }

export interface DimensaoFinal {
  largura: number
  altura: number
  redimensionou: boolean
  escalaLargura: number
  escalaAltura: number
}

export function limiteDimensaoValido(valor: number | undefined): boolean {
  return valor === undefined || (Number.isInteger(valor) && valor >= 1 && valor <= LIMITE_LADO)
}

export function lerLimiteOpcional(
  texto: string,
  lado: 'largura' | 'altura',
  exato = false,
): { ok: true; valor?: number } | { ok: false; mensagem: string } {
  const limpo = texto.trim()
  const nome = exato
    ? lado === 'largura'
      ? 'largura final'
      : 'altura final'
    : lado === 'largura'
      ? 'largura máxima'
      : 'altura máxima'
  if (limpo === '') return { ok: true }
  if (!/^\d+$/.test(limpo)) {
    return { ok: false, mensagem: `A ${nome} precisa ser um número inteiro entre 1 e ${LIMITE_LADO}.` }
  }
  const valor = Number(limpo)
  if (!Number.isSafeInteger(valor) || valor < 1 || valor > LIMITE_LADO) {
    return { ok: false, mensagem: `A ${nome} precisa ser um número inteiro entre 1 e ${LIMITE_LADO}.` }
  }
  return { ok: true, valor }
}

export function montarLimites(entrada: {
  manterDimensoes: boolean
  manterProporcao: boolean
  referencia: ReferenciaDimensao
  textoLargura: string
  textoAltura: string
}): { ok: true; pedido: PedidoDimensao } | { ok: false; mensagem: string } {
  if (entrada.manterDimensoes) return { ok: true, pedido: { modo: 'nenhum' } }

  if (entrada.manterProporcao) {
    const lado = entrada.referencia
    const texto = lado === 'largura' ? entrada.textoLargura : entrada.textoAltura
    const lido = lerLimiteOpcional(texto, lado)
    if (!lido.ok) return lido
    if (lido.valor === undefined) {
      return {
        ok: false,
        mensagem: lado === 'largura' ? 'Informe a largura máxima.' : 'Informe a altura máxima.',
      }
    }
    return lado === 'largura'
      ? { ok: true, pedido: { modo: 'proporcional', referencia: 'largura', largura: lido.valor } }
      : { ok: true, pedido: { modo: 'proporcional', referencia: 'altura', altura: lido.valor } }
  }

  const largura = lerLimiteOpcional(entrada.textoLargura, 'largura', true)
  const altura = lerLimiteOpcional(entrada.textoAltura, 'altura', true)
  if (!largura.ok) return largura
  if (!altura.ok) return altura
  if (largura.valor === undefined || altura.valor === undefined) {
    return { ok: false, mensagem: 'Informe a largura final e a altura final.' }
  }
  return { ok: true, pedido: { modo: 'exato', largura: largura.valor, altura: altura.valor } }
}

export function resolverDimensoes(
  largura: number,
  altura: number,
  pedido: PedidoDimensao,
): { ok: true; dimensao: DimensaoFinal } | { ok: false; codigo: CodigoErro } {
  if (pedido.modo === 'nenhum') return { ok: true, dimensao: dimensaoOriginal(largura, altura) }
  if (pedido.modo === 'exato') return dimensaoExata(largura, altura, pedido.largura, pedido.altura)
  const limite = pedido.referencia === 'largura' ? pedido.largura : pedido.altura
  return { ok: true, dimensao: dimensaoProporcional(largura, altura, pedido.referencia, limite) }
}

function dimensaoProporcional(
  largura: number,
  altura: number,
  referencia: ReferenciaDimensao,
  limite: number,
): DimensaoFinal {
  const lado = referencia === 'largura' ? largura : altura
  if (limite >= lado) return dimensaoOriginal(largura, altura)
  const escala = limite / lado
  let novaLargura = Math.max(1, Math.round(largura * escala))
  let novaAltura = Math.max(1, Math.round(altura * escala))
  if (referencia === 'largura' && novaLargura > limite) novaLargura = limite
  if (referencia === 'altura' && novaAltura > limite) novaAltura = limite
  const redimensionou = novaLargura !== largura || novaAltura !== altura
  if (!redimensionou) return dimensaoOriginal(largura, altura)
  return {
    largura: novaLargura,
    altura: novaAltura,
    redimensionou,
    escalaLargura: novaLargura / largura,
    escalaAltura: novaAltura / altura,
  }
}

function dimensaoExata(
  largura: number,
  altura: number,
  destinoLargura: number,
  destinoAltura: number,
): { ok: true; dimensao: DimensaoFinal } | { ok: false; codigo: 'AMPLIACAO_RECUSADA' } {
  if (destinoLargura > largura || destinoAltura > altura) {
    return { ok: false, codigo: 'AMPLIACAO_RECUSADA' }
  }
  const redimensionou = destinoLargura !== largura || destinoAltura !== altura
  return {
    ok: true,
    dimensao: {
      largura: destinoLargura,
      altura: destinoAltura,
      redimensionou,
      escalaLargura: destinoLargura / largura,
      escalaAltura: destinoAltura / altura,
    },
  }
}

function dimensaoOriginal(largura: number, altura: number): DimensaoFinal {
  return { largura, altura, redimensionou: false, escalaLargura: 1, escalaAltura: 1 }
}

export function descreverEscalas(
  larguraOriginal: number,
  alturaOriginal: number,
  larguraFinal: number,
  alturaFinal: number,
): string {
  if (larguraOriginal === larguraFinal && alturaOriginal === alturaFinal) {
    return `Original e resultado têm ${larguraOriginal}×${alturaOriginal} px.`
  }
  const largura = formatarPercentual((larguraFinal / larguraOriginal) * 100)
  const altura = formatarPercentual((alturaFinal / alturaOriginal) * 100)
  return `Original ${larguraOriginal}×${alturaOriginal} px. Resultado ${larguraFinal}×${alturaFinal} px, com ${largura} da largura e ${altura} da altura. Em 100%, cada imagem usa o próprio tamanho em pixels.`
}
