export function podeAtualizarAgora(processando: boolean, exportando: boolean): boolean {
  return !processando && !exportando
}

export function sessaoTemImagens(quantidade: number): boolean {
  return quantidade > 0
}
