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

const NOMES_RESERVADOS = new Set([
  'con', 'prn', 'aux', 'nul',
  'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
  'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9',
])

export function evitarNomeReservado(caminho: string): string {
  return caminho.split('/').map((parte) => {
    const ponto = parte.lastIndexOf('.')
    const base = ponto > 0 ? parte.slice(0, ponto) : parte
    const extensao = ponto > 0 ? parte.slice(ponto) : ''
    if (!NOMES_RESERVADOS.has(base.toLowerCase())) return parte
    return `${base}_${extensao}`
  }).join('/')
}

export function proximoNomeLivre(caminho: string, ocupado: (candidato: string) => boolean): string {
  const seguro = evitarNomeReservado(sanitizarCaminhoRelativo(caminho))
  let candidato = seguro
  let indice = 2
  while (ocupado(candidato)) {
    candidato = comSufixo(seguro, indice)
    indice += 1
  }
  return candidato
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
