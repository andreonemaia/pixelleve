export function possuiTransparencia(pixels: Uint8ClampedArray): boolean {
  for (let indice = 3; indice < pixels.length; indice += 4) {
    if (pixels[indice] !== 255) return true
  }
  return false
}

export function fundoValido(valor: string | undefined): valor is string {
  return typeof valor === 'string' && /^#[0-9a-fA-F]{6}$/.test(valor)
}

export function aplicarFundo(
  pixels: Uint8ClampedArray,
  largura: number,
  altura: number,
  fundo: string,
): Uint8ClampedArray {
  if (!fundoValido(fundo)) {
    throw new Error('Cor de fundo inválida.')
  }
  if (pixels.length !== largura * altura * 4) {
    throw new Error('Pixels não correspondem às dimensões.')
  }

  const vermelho = Number.parseInt(fundo.slice(1, 3), 16)
  const verde = Number.parseInt(fundo.slice(3, 5), 16)
  const azul = Number.parseInt(fundo.slice(5, 7), 16)
  const saida = new Uint8ClampedArray(pixels.length)

  for (let indice = 0; indice < pixels.length; indice += 4) {
    const alpha = pixels[indice + 3] / 255
    saida[indice] = Math.round(pixels[indice] * alpha + vermelho * (1 - alpha))
    saida[indice + 1] = Math.round(pixels[indice + 1] * alpha + verde * (1 - alpha))
    saida[indice + 2] = Math.round(pixels[indice + 2] * alpha + azul * (1 - alpha))
    saida[indice + 3] = 255
  }

  return saida
}
