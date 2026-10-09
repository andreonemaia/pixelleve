export function calcularEconomia(bytesEntrada: number, bytesSaida: number): number {
  if (bytesEntrada <= 0) {
    throw new Error('Tamanho de entrada inválido.')
  }
  return ((bytesEntrada - bytesSaida) / bytesEntrada) * 100
}

export function formatarPercentual(valor: number): string {
  const arredondado = Math.round(valor * 10) / 10
  const texto = arredondado.toLocaleString('pt-BR', {
    minimumFractionDigits: Number.isInteger(arredondado) ? 0 : 1,
    maximumFractionDigits: 1,
  })
  return `${texto}%`
}

export function descreverEconomia(
  bytesEntrada: number,
  bytesSaida: number,
  usouOriginal: boolean,
): string {
  if (usouOriginal) return 'Já estava otimizada'
  const economia = calcularEconomia(bytesEntrada, bytesSaida)
  if (economia < 0) return `${formatarPercentual(Math.abs(economia))} maior`
  if (economia === 0) return 'Mesmo tamanho'
  return `${formatarPercentual(economia)} menor`
}

export function formatarBytes(valor: number): string {
  return `${valor.toLocaleString('pt-BR')} bytes`
}
