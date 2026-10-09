import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { crc32, deflateSync } from 'node:zlib'

const pasta = dirname(fileURLToPath(import.meta.url))
mkdirSync(pasta, { recursive: true })

function u32be(valor) {
  const buffer = Buffer.alloc(4)
  buffer.writeUInt32BE(valor)
  return buffer
}

function pedaco(tipo, dados) {
  const nome = Buffer.from(tipo)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([nome, dados])) >>> 0)
  return Buffer.concat([u32be(dados.length), nome, dados, crc])
}

function png({ largura, altura, rgba, tipoCor = 6, extra = [] }) {
  const cabecalho = Buffer.alloc(13)
  cabecalho.writeUInt32BE(largura, 0)
  cabecalho.writeUInt32BE(altura, 4)
  cabecalho[8] = 8
  cabecalho[9] = tipoCor
  const canais = tipoCor === 2 ? 3 : 4
  const bruto = Buffer.alloc(altura * (1 + largura * canais))
  for (let y = 0; y < altura; y += 1) {
    const linha = y * (1 + largura * canais)
    bruto[linha] = 0
    for (let x = 0; x < largura; x += 1) {
      const origem = (y * largura + x) * 4
      const destino = linha + 1 + x * canais
      bruto[destino] = rgba[origem]
      bruto[destino + 1] = rgba[origem + 1]
      bruto[destino + 2] = rgba[origem + 2]
      if (canais === 4) bruto[destino + 3] = rgba[origem + 3]
    }
  }
  const assinatura = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    assinatura,
    pedaco('IHDR', cabecalho),
    ...extra,
    pedaco('IDAT', deflateSync(bruto)),
    pedaco('IEND', Buffer.alloc(0)),
  ])
}

function rgba(largura, altura, pintar) {
  const pixels = Buffer.alloc(largura * altura * 4)
  for (let y = 0; y < altura; y += 1) {
    for (let x = 0; x < largura; x += 1) {
      const cor = pintar(x, y)
      const indice = (y * largura + x) * 4
      pixels[indice] = cor[0]
      pixels[indice + 1] = cor[1]
      pixels[indice + 2] = cor[2]
      pixels[indice + 3] = cor[3]
    }
  }
  return pixels
}

const grafico = png({
  largura: 32,
  altura: 32,
  rgba: rgba(32, 32, (x, y) => {
    if (x === 16 && y === 16) return [200, 20, 20, 255]
    if (x === 8 && y === 8) return [0, 0, 255, 128]
    if (x < 2 || y < 2) return [0, 0, 0, 0]
    return [20, 160, 90, 255]
  }),
})

const texto = png({
  largura: 80,
  altura: 24,
  tipoCor: 2,
  rgba: rgba(80, 24, (x, y) => {
    const traco = (x >= 8 && x <= 14 && y >= 4 && y <= 20) || (x >= 8 && x <= 28 && y >= 10 && y <= 14)
    const letra = (x >= 40 && x <= 46 && y >= 4 && y <= 20) || (x >= 40 && x <= 58 && y >= 4 && y <= 8)
    return traco || letra ? [10, 10, 10, 255] : [255, 255, 255, 255]
  }),
})

const foto = png({
  largura: 48,
  altura: 48,
  tipoCor: 2,
  rgba: rgba(48, 48, (x, y) => [40 + x * 3, 30 + y * 2, 80 + ((x + y) % 20) * 4, 255]),
})

const quadros = Buffer.alloc(8)
quadros.writeUInt32BE(2, 0)
quadros.writeUInt32BE(0, 4)
const animado = png({
  largura: 8,
  altura: 8,
  tipoCor: 2,
  rgba: rgba(8, 8, () => [255, 0, 0, 255]),
  extra: [pedaco('acTL', quadros)],
})

function pedacoWebp(tipo, dados) {
  const tamanho = Buffer.alloc(4)
  tamanho.writeUInt32LE(dados.length)
  const preenchimento = dados.length % 2 === 1 ? Buffer.from([0]) : Buffer.alloc(0)
  return Buffer.concat([Buffer.from(tipo), tamanho, dados, preenchimento])
}

const vp8x = Buffer.alloc(10)
vp8x[0] = 0x02
vp8x[4] = 15
vp8x[7] = 15
const anim = Buffer.alloc(6)
const corpo = Buffer.concat([pedacoWebp('VP8X', vp8x), pedacoWebp('ANIM', anim)])
const tamanhoRiff = Buffer.alloc(4)
tamanhoRiff.writeUInt32LE(4 + corpo.length)
const webpAnimado = Buffer.concat([Buffer.from('RIFF'), tamanhoRiff, Buffer.from('WEBP'), corpo])

const arquivos = {
  'grafico-alpha.png': grafico,
  'texto.png': texto,
  'foto-sintetica.png': foto,
  'animado.apng': animado,
  'animado.webp': webpAnimado,
  'truncado.png': Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0]),
  'invalido.jpg': Buffer.from('nao-e-imagem'),
}

for (const [nome, conteudo] of Object.entries(arquivos)) {
  const caminho = join(pasta, nome)
  writeFileSync(caminho, conteudo)
  const hash = createHash('sha256').update(conteudo).digest('hex')
  console.log(`${nome} ${conteudo.length} ${hash}`)
}
