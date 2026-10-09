import { nomeDeSaida } from './nomes'

export function sanitizarCaminhoRelativo(caminho: string): string {
  const partes = caminho.replace(/\\/g, '/').split('/')
  const limpas: string[] = []
  for (const parte of partes) {
    if (parte === '' || parte === '.') continue
    if (parte === '..') {
      limpas.pop()
      continue
    }
    const limpa = limparParte(parte).replace(/^\.+/, '').trim()
    limpas.push(limpa || 'arquivo')
  }
  return limpas.join('/') || 'imagem'
}

function limparParte(parte: string): string {
  let saida = ''
  for (const caractere of parte) {
    const codigo = caractere.codePointAt(0) ?? 0
    saida += codigo < 32 || '<>:"|?*'.includes(caractere) ? '_' : caractere
  }
  return saida
}

export function caminhoDeSaida(caminhoRelativo: string, extensao: string): string {
  const seguro = sanitizarCaminhoRelativo(caminhoRelativo)
  const barra = seguro.lastIndexOf('/')
  const pasta = barra >= 0 ? seguro.slice(0, barra + 1) : ''
  const nome = seguro.slice(barra + 1)
  return `${pasta}${nomeDeSaida(nome, extensao)}`
}

export function nomesUnicos(caminhos: readonly string[]): string[] {
  const usados = new Set<string>()
  return caminhos.map((caminho) => {
    let candidato = caminho
    let indice = 2
    while (usados.has(candidato.toLowerCase())) {
      candidato = comSufixo(caminho, indice)
      indice += 1
    }
    usados.add(candidato.toLowerCase())
    return candidato
  })
}

export function partirCaminho(caminho: string): { pasta: string; nome: string } {
  const normalizado = caminho.replace(/\\/g, '/')
  const barra = normalizado.lastIndexOf('/')
  if (barra < 0) return { pasta: '', nome: normalizado }
  return { pasta: normalizado.slice(0, barra), nome: normalizado.slice(barra + 1) }
}

function comSufixo(caminho: string, indice: number): string {
  const barra = caminho.lastIndexOf('/')
  const pasta = barra >= 0 ? caminho.slice(0, barra + 1) : ''
  const nome = caminho.slice(barra + 1)
  const ponto = nome.lastIndexOf('.')
  if (ponto <= 0) return `${pasta}${nome} (${indice})`
  return `${pasta}${nome.slice(0, ponto)} (${indice})${nome.slice(ponto)}`
}
