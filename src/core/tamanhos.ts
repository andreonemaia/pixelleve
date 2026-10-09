import { calcularEconomia, formatarPercentual } from './metricas'

const KB = 1024
const MB = 1024 * 1024

export interface ParBytes {
  bytesEntrada: number
  bytesSaida: number
}

export interface ResumoLote {
  quantidade: number
  bytesEntrada: number
  bytesSaida: number
  economiaBytes: number
  percentual: number
}

export function formatarTamanho(bytes: number): string {
  const absoluto = Math.abs(bytes)
  if (absoluto < KB) return `${Math.round(bytes).toLocaleString('pt-BR')} B`
  if (absoluto < MB) {
    const valor = bytes / KB
    return `${formatarNumero(valor, valor >= 100 ? 0 : 1)} KB`
  }
  const valor = bytes / MB
  const casas = valor >= 100 ? 0 : valor >= 10 ? 1 : 2
  return `${formatarNumero(valor, casas)} MB`
}

export function descreverPar(bytesEntrada: number, bytesSaida: number, usouOriginal: boolean): string {
  const origem = formatarTamanho(bytesEntrada)
  const destino = formatarTamanho(usouOriginal ? bytesEntrada : bytesSaida)
  if (usouOriginal) return `${origem} → ${destino} · Economia zero`
  const diferenca = bytesEntrada - bytesSaida
  if (diferenca > 0) {
    return `${origem} → ${destino} · Economizou ${formatarTamanho(diferenca)} (${formatarPercentual(calcularEconomia(bytesEntrada, bytesSaida))})`
  }
  if (diferenca < 0) {
    return `${origem} → ${destino} · Aumentou ${formatarTamanho(-diferenca)} (${formatarPercentual(Math.abs(calcularEconomia(bytesEntrada, bytesSaida)))})`
  }
  return `${origem} → ${destino} · Mesmo tamanho`
}

export function resumirLote(pares: readonly ParBytes[]): ResumoLote {
  let bytesEntrada = 0
  let bytesSaida = 0
  for (const par of pares) {
    bytesEntrada += par.bytesEntrada
    bytesSaida += par.bytesSaida
  }
  return {
    quantidade: pares.length,
    bytesEntrada,
    bytesSaida,
    economiaBytes: bytesEntrada - bytesSaida,
    percentual: bytesEntrada === 0 ? 0 : calcularEconomia(bytesEntrada, bytesSaida),
  }
}

export function textoResumo(resumo: ResumoLote, parcial: boolean): string {
  const rotulo = parcial ? 'Economia até agora' : 'Economia do lote'
  if (resumo.quantidade === 0) return `${rotulo}: nenhuma imagem concluída`
  const imagens = resumo.quantidade === 1 ? '1 imagem' : `${resumo.quantidade} imagens`
  const faixa = `${formatarTamanho(resumo.bytesEntrada)} → ${formatarTamanho(resumo.bytesSaida)}`
  if (resumo.economiaBytes > 0) {
    return `${rotulo}: ${imagens} · ${faixa} · Economizou ${formatarTamanho(resumo.economiaBytes)} (${formatarPercentual(resumo.percentual)})`
  }
  if (resumo.economiaBytes < 0) {
    return `${rotulo}: ${imagens} · ${faixa} · Aumentou ${formatarTamanho(-resumo.economiaBytes)} (${formatarPercentual(Math.abs(resumo.percentual))})`
  }
  return `${rotulo}: ${imagens} · ${faixa} · Economia zero`
}

function formatarNumero(valor: number, casas: number): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: casas,
  })
}
