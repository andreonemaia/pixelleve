import { formatarPercentual } from './metricas'

export const LIMITE_LADO = 16_384

export interface LimitesRedimensionamento {
  larguraMaxima?: number
  alturaMaxima?: number
  ampliar?: boolean
}

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
): { ok: true; valor?: number } | { ok: false; mensagem: string } {
  const limpo = texto.trim()
  const nome = lado === 'largura' ? 'largura máxima' : 'altura máxima'
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
  textoLargura: string
  textoAltura: string
}): { ok: true; larguraMaxima?: number; alturaMaxima?: number; ampliar: false } | { ok: false; mensagem: string } {
  if (entrada.manterDimensoes) return { ok: true, ampliar: false }
  const largura = lerLimiteOpcional(entrada.textoLargura, 'largura')
  const altura = lerLimiteOpcional(entrada.textoAltura, 'altura')
  if (!largura.ok || !altura.ok) {
    return {
      ok: false,
      mensagem: [largura.ok ? '' : largura.mensagem, altura.ok ? '' : altura.mensagem].filter(Boolean).join(' '),
    }
  }
  return { ok: true, larguraMaxima: largura.valor, alturaMaxima: altura.valor, ampliar: false }
}

export function calcularDimensoes(largura: number, altura: number, limites: LimitesRedimensionamento): DimensaoFinal {
  const ampliar = limites.ampliar === true
  let escala = ampliar ? Number.POSITIVE_INFINITY : 1
  if (limites.larguraMaxima) escala = Math.min(escala, limites.larguraMaxima / largura)
  if (limites.alturaMaxima) escala = Math.min(escala, limites.alturaMaxima / altura)
  if (!Number.isFinite(escala)) escala = 1
  if (escala === 1) {
    return { largura, altura, redimensionou: false, escalaLargura: 1, escalaAltura: 1 }
  }

  let novaLargura = Math.max(1, Math.round(largura * escala))
  let novaAltura = Math.max(1, Math.round(altura * escala))
  if (limites.larguraMaxima && novaLargura > limites.larguraMaxima) novaLargura = limites.larguraMaxima
  if (limites.alturaMaxima && novaAltura > limites.alturaMaxima) novaAltura = limites.alturaMaxima
  const redimensionou = novaLargura !== largura || novaAltura !== altura
  return {
    largura: novaLargura,
    altura: novaAltura,
    redimensionou,
    escalaLargura: novaLargura / largura,
    escalaAltura: novaAltura / altura,
  }
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
