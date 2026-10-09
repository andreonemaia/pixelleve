import { crc32, deflateSync } from 'node:zlib'

export function pngRgba(
  largura: number,
  altura: number,
  pintar: (x: number, y: number) => [number, number, number, number],
): Buffer {
  const canais = 4
  const bruto = Buffer.alloc(altura * (1 + largura * canais))
  for (let y = 0; y < altura; y += 1) {
    const linha = y * (1 + largura * canais)
    bruto[linha] = 0
    for (let x = 0; x < largura; x += 1) {
      const cor = pintar(x, y)
      const destino = linha + 1 + x * canais
      bruto[destino] = cor[0]
      bruto[destino + 1] = cor[1]
      bruto[destino + 2] = cor[2]
      bruto[destino + 3] = cor[3]
    }
  }
  return montarPng(largura, altura, bruto)
}

export function gradePng(largura: number, altura: number): Buffer {
  const canais = 4
  const bruto = Buffer.alloc(altura * (1 + largura * canais))
  for (let y = 0; y < altura; y += 1) {
    const linha = y * (1 + largura * canais)
    bruto[linha] = 0
    for (let x = 0; x < largura; x += 1) {
      const destino = linha + 1 + x * canais
      const barra = y % 36 < 2 || x % 72 < 2
      bruto[destino] = barra ? 16 : (x * 13 + y) & 255
      bruto[destino + 1] = barra ? 24 : (y * 9) & 255
      bruto[destino + 2] = barra ? 32 : (x * 5) & 255
      bruto[destino + 3] = x < 6 && y < 6 ? 0 : 255
    }
  }
  return montarPng(largura, altura, bruto)
}

function montarPng(largura: number, altura: number, bruto: Buffer): Buffer {
  const cabecalho = Buffer.alloc(13)
  cabecalho.writeUInt32BE(largura, 0)
  cabecalho.writeUInt32BE(altura, 4)
  cabecalho[8] = 8
  cabecalho[9] = 6
  const assinatura = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([assinatura, pedaco('IHDR', cabecalho), pedaco('IDAT', deflateSync(bruto)), pedaco('IEND', Buffer.alloc(0))])
}

function pedaco(tipo: string, dados: Buffer): Buffer {
  const nome = Buffer.from(tipo)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([nome, dados])) >>> 0)
  const tamanho = Buffer.alloc(4)
  tamanho.writeUInt32BE(dados.length)
  return Buffer.concat([tamanho, nome, dados, crc])
}
