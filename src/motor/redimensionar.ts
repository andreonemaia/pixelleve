export function redimensionarRgba(
  origem: Uint8ClampedArray,
  largura: number,
  altura: number,
  novaLargura: number,
  novaAltura: number,
): Uint8ClampedArray {
  if (novaLargura === largura && novaAltura === altura) return new Uint8ClampedArray(origem)
  const saida = new Uint8ClampedArray(novaLargura * novaAltura * 4)
  const escalaX = largura / novaLargura
  const escalaY = altura / novaAltura

  for (let y = 0; y < novaAltura; y += 1) {
    const y0 = y * escalaY
    const y1 = (y + 1) * escalaY
    const yInicio = Math.floor(y0)
    const yFim = Math.min(altura, Math.ceil(y1))
    for (let x = 0; x < novaLargura; x += 1) {
      const x0 = x * escalaX
      const x1 = (x + 1) * escalaX
      const xInicio = Math.floor(x0)
      const xFim = Math.min(largura, Math.ceil(x1))
      let peso = 0
      let accA = 0
      let accR = 0
      let accG = 0
      let accB = 0
      for (let sy = yInicio; sy < yFim; sy += 1) {
        const coberturaY = Math.min(y1, sy + 1) - Math.max(y0, sy)
        if (coberturaY <= 0) continue
        for (let sx = xInicio; sx < xFim; sx += 1) {
          const coberturaX = Math.min(x1, sx + 1) - Math.max(x0, sx)
          if (coberturaX <= 0) continue
          const cobertura = coberturaX * coberturaY
          const indice = (sy * largura + sx) * 4
          const alpha = origem[indice + 3] / 255
          peso += cobertura
          accA += alpha * cobertura
          accR += origem[indice] * alpha * cobertura
          accG += origem[indice + 1] * alpha * cobertura
          accB += origem[indice + 2] * alpha * cobertura
        }
      }
      const destino = (y * novaLargura + x) * 4
      if (peso <= 0 || accA <= 0) continue
      saida[destino] = Math.round(accR / accA)
      saida[destino + 1] = Math.round(accG / accA)
      saida[destino + 2] = Math.round(accB / accA)
      saida[destino + 3] = Math.round((accA / peso) * 255)
    }
  }
  return saida
}
