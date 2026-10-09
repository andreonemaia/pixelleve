export type EstadoItem = 'aguardando' | 'processando' | 'concluido' | 'sem-reducao' | 'maior' | 'falha' | 'cancelado'

export interface ContagemFila {
  total: number
  aguardando: number
  processando: number
  concluidas: number
  falhas: number
  cancelados: number
  ignorados: number
}

export function estadoDeResultado(
  bytesEntrada: number,
  bytesSaida: number,
  usouOriginal: boolean,
): EstadoItem {
  if (usouOriginal || bytesSaida === bytesEntrada) return 'sem-reducao'
  if (bytesSaida > bytesEntrada) return 'maior'
  return 'concluido'
}

export function contarFila(estados: readonly EstadoItem[], ignorados: number): ContagemFila {
  const contagem: ContagemFila = {
    total: estados.length,
    aguardando: 0,
    processando: 0,
    concluidas: 0,
    falhas: 0,
    cancelados: 0,
    ignorados,
  }
  for (const estado of estados) {
    if (estado === 'aguardando') contagem.aguardando += 1
    else if (estado === 'processando') contagem.processando += 1
    else if (estado === 'falha') contagem.falhas += 1
    else if (estado === 'cancelado') contagem.cancelados += 1
    else contagem.concluidas += 1
  }
  return contagem
}

export function textoProgresso(contagem: ContagemFila): string {
  const feitos = contagem.total - contagem.aguardando - contagem.processando
  return `${feitos} de ${contagem.total} imagens concluídas`
}

export function textoContagem(contagem: ContagemFila): string {
  return `${contagem.aguardando} aguardando · ${contagem.falhas} falharam · ${contagem.ignorados} ignorados · ${contagem.cancelados} cancelados`
}

export function aplicarCancelamento<T extends { estado: EstadoItem; mensagem: string; conclusao: number }>(
  itens: readonly T[],
): T[] {
  return itens.map((item) =>
    item.estado === 'processando'
      ? { ...item, estado: 'cancelado', mensagem: 'Cancelado', conclusao: item.conclusao + 1 }
      : item,
  )
}
