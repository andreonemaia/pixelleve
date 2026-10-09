export function nomeDeSaida(nomeOriginal: string, extensao: string): string {
  const base = nomeOriginal.split(/[/\\]/).pop() ?? 'imagem'
  const semExtensao = base.replace(/\.[^.]+$/, '')
  const limpo = semExtensao.replace(/[^\w.\- ()\u00C0-\u024F]+/g, '_').slice(0, 80)
  return `${limpo || 'imagem'}.${extensao}`
}
