import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { unzipSync } from 'fflate'
import { expect, test, type Page } from '@playwright/test'
import { calcularDimensoes } from '../../src/core/dimensoes'
import { compararPixels } from '../../src/core/pixels'
import { formatarTamanho } from '../../src/core/tamanhos'
import { redimensionarRgba } from '../../src/motor/redimensionar'
import { gradePng, pngRgba } from '../apoio/gradePng'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '../..')
const pasta = join(raiz, 'test-results/etapa1')
const fixtures = join(raiz, 'tests/fixtures')

test.beforeAll(() => {
  mkdirSync(pasta, { recursive: true })
  writeFileSync(join(pasta, 'horizontal.png'), pngRgba(200, 100, (x) => (x < 100 ? [180, 40, 40, 255] : [40, 40, 180, 255])))
  writeFileSync(join(pasta, 'vertical.png'), pngRgba(100, 200, (x, y) => [40 + (x % 5), 40 + (y % 20), 160, 255]))
  writeFileSync(join(pasta, 'ambos.png'), pngRgba(200, 100, () => [20, 120, 80, 255]))
  writeFileSync(join(pasta, 'menor.png'), pngRgba(40, 30, () => [10, 10, 10, 255]))
  writeFileSync(join(pasta, 'arredondar.png'), pngRgba(100, 33, () => [240, 240, 240, 255]))
  writeFileSync(join(pasta, 'faixa.png'), pngRgba(30, 15, (x, y) => (x === 7 || y === 3 ? [255, 0, 0, 255] : [0, 0, 0, 255])))
  writeFileSync(
    join(pasta, 'transparente.png'),
    pngRgba(32, 32, (x, y) => (x < 8 || y < 8 || x >= 24 || y >= 24 ? [0, 0, 0, 0] : [220, 20, 20, 255])),
  )
})

test('aplica um limite, dois limites, imagem menor e arredondamento', async ({ page }) => {
  test.setTimeout(180_000)
  await abrir(page)
  await page.getByLabel('Preset').selectOption('leve')
  await soltarDimensoes(page)
  await conferirSaida(page, 'horizontal.png', { largura: '100', altura: '' }, 100, 50)
  await conferirSaida(page, 'vertical.png', { largura: '', altura: '80' }, 40, 80)
  await conferirSaida(page, 'ambos.png', { largura: '50', altura: '80' }, 50, 25)
  await conferirSaida(page, 'menor.png', { largura: '200', altura: '180' }, 40, 30)
  await conferirSaida(page, 'arredondar.png', { largura: '10', altura: '' }, 10, 3)
})

test('recusa limite inválido antes de processar', async ({ page }) => {
  await abrir(page)
  await page.locator('#arquivo').setInputFiles(join(fixtures, 'texto.png'))
  await soltarDimensoes(page)
  await page.getByLabel('Largura máxima').fill('0')
  await expect(page.getByRole('alert')).toContainText('largura máxima')
  await expect(page.getByRole('button', { name: 'Comprimir lote' })).toBeDisabled()
  await page.getByLabel('Largura máxima').fill('1.5')
  await expect(page.getByRole('alert')).toContainText('inteiro')
})

test('preserva transparência no PNG e compõe o fundo no JPEG', async ({ page }) => {
  test.setTimeout(120_000)
  await abrir(page)
  await page.getByLabel('Preset').selectOption('leve')
  await soltarDimensoes(page)
  await page.getByLabel('Largura máxima').fill('16')
  await page.locator('#arquivo').setInputFiles(join(pasta, 'transparente.png'))
  await page.getByRole('button', { name: 'Comprimir lote' }).click()
  await expect(page.locator('[data-teste="linha"]')).toHaveAttribute('data-estado', /concluido|sem-reducao|maior/)
  await page.locator('[data-teste="linha"]').getByRole('button', { name: 'Comparar' }).click()
  const png = await lerAmostra(page, '[data-teste="resultado"]')
  expect(png.largura).toBe(16)
  expect(png.altura).toBe(16)
  expect(canal(png.pixels, 16, 0, 0, 3)).toBe(0)
  expect(canal(png.pixels, 16, 8, 8, 3)).toBe(255)
  await page.getByRole('button', { name: 'Fechar' }).click()

  await page.getByLabel('Formato de saída').selectOption('jpeg')
  await page.locator('#fundo').fill('#000000')
  const linha = page.locator('[data-teste="linha"]')
  const anterior = await linha.getAttribute('data-conclusao')
  await linha.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect.poll(async () => linha.getAttribute('data-conclusao'), { timeout: 60_000 }).not.toBe(anterior)
  expect(await linha.getAttribute('data-largura-saida')).toBe('16')
  await linha.getByRole('button', { name: 'Comparar' }).click()
  const jpeg = await lerAmostra(page, '[data-teste="resultado"]')
  expect(canal(jpeg.pixels, 16, 0, 0, 0)).toBeLessThan(40)
  expect(canal(jpeg.pixels, 16, 8, 8, 0)).toBeGreaterThan(150)
  await expect(page.locator('[data-teste="dimensoes"]')).toContainText('image/jpeg')
})

test('reprocessa o original e não acumula o redimensionamento', async ({ page }) => {
  test.setTimeout(120_000)
  await abrir(page)
  await page.getByLabel('Preset').selectOption('leve')
  await soltarDimensoes(page)
  const arquivo = readFileSync(join(pasta, 'faixa.png'))
  await page.getByLabel('Largura máxima').fill('12')
  await page.locator('#arquivo').setInputFiles(join(pasta, 'faixa.png'))
  await page.getByRole('button', { name: 'Comprimir lote' }).click()
  const linha = page.locator('[data-teste="linha"]')
  await expect(linha).toHaveAttribute('data-largura-saida', '12')
  const entrada = Number(await linha.getAttribute('data-bytes-entrada'))
  expect(entrada).toBe(arquivo.byteLength)

  await page.getByLabel('Largura máxima').fill('8')
  const anterior = await linha.getAttribute('data-conclusao')
  await linha.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect.poll(async () => linha.getAttribute('data-conclusao'), { timeout: 60_000 }).not.toBe(anterior)
  const dimensao = calcularDimensoes(30, 15, { larguraMaxima: 8 })
  expect(await linha.getAttribute('data-largura-saida')).toBe(String(dimensao.largura))
  expect(await linha.getAttribute('data-altura-saida')).toBe(String(dimensao.altura))
  expect(Number(await linha.getAttribute('data-bytes-entrada'))).toBe(entrada)
  await linha.getByRole('button', { name: 'Comparar' }).click()
  const original = await page.locator('[data-teste="original"]').evaluate((img: HTMLImageElement) => ({
    largura: img.naturalWidth,
    altura: img.naturalHeight,
  }))
  expect(original).toEqual({ largura: 30, altura: 15 })
  const resultado = await lerAmostra(page, '[data-teste="resultado"]')
  const esperado = redimensionarRgba(pixelsFaixa(), 30, 15, dimensao.largura, dimensao.altura)
  expect(compararPixels(resultado, { largura: dimensao.largura, altura: dimensao.altura, pixels: esperado })).toEqual({
    iguais: true,
    motivo: 'iguais',
  })
})

test('congela o limite do item em andamento e aplica o novo no seguinte', async ({ page }) => {
  test.setTimeout(180_000)
  writeFileSync(join(pasta, 'grande.png'), gradePng(1600, 1200))
  writeFileSync(join(pasta, 'seguinte.png'), pngRgba(200, 100, () => [90, 90, 90, 255]))
  await abrir(page)
  await page.getByLabel('Preset').selectOption('maxima')
  await page.getByLabel('Largura máxima').fill('100')
  await page.locator('#arquivo').setInputFiles([join(pasta, 'grande.png'), join(pasta, 'seguinte.png')])
  await expect(page.locator('[data-teste="linha"]')).toHaveCount(2)
  await page.getByRole('button', { name: 'Comprimir lote' }).click()
  const grande = page.locator('[data-caminho="grande.png"]')
  const seguinte = page.locator('[data-caminho="seguinte.png"]')
  await expect(grande).toHaveAttribute('data-estado', 'processando')
  await soltarDimensoes(page)
  await expect(seguinte).toHaveAttribute('data-estado', 'aguardando')
  await expect.poll(async () => page.locator('[data-estado="aguardando"], [data-estado="processando"]').count(), { timeout: 120_000 }).toBe(0)
  expect(await grande.getAttribute('data-largura-saida')).toBe('1600')
  expect(await grande.getAttribute('data-altura-saida')).toBe('1200')
  expect(await seguinte.getAttribute('data-largura-saida')).toBe('100')
  expect(await seguinte.getAttribute('data-altura-saida')).toBe('50')
})

test('o ZIP extraído repete dimensões e bytes exibidos', async ({ page }) => {
  test.setTimeout(120_000)
  await abrir(page)
  await page.getByLabel('Preset').selectOption('leve')
  await soltarDimensoes(page)
  await page.getByLabel('Largura máxima').fill('100')
  await page.locator('#arquivo').setInputFiles(join(pasta, 'horizontal.png'))
  await page.getByRole('button', { name: 'Comprimir lote' }).click()
  const linha = page.locator('[data-teste="linha"]')
  await expect(linha).toHaveAttribute('data-largura-saida', '100')
  const bytesSaida = Number(await linha.getAttribute('data-bytes-saida'))
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Baixar lote em ZIP' }).click(),
  ])
  const arquivoZip = readFileSync(await download.path())
  const aberto = unzipSync(arquivoZip)
  const extraido = aberto['horizontal.png']
  expect(extraido).toBeTruthy()
  const png = Buffer.from(extraido)
  expect(png.length).toBe(bytesSaida)
  expect(png.readUInt32BE(16)).toBe(100)
  expect(png.readUInt32BE(20)).toBe(50)
  const status = await page.getByRole('status').innerText()
  expect(status).toContain(formatarTamanho(bytesSaida))
  if (formatarTamanho(arquivoZip.byteLength) !== formatarTamanho(bytesSaida)) {
    expect(status).not.toContain(formatarTamanho(arquivoZip.byteLength))
  }
})

test('o slider responde ao teclado e o zoom de 100% não estica o resultado', async ({ page }) => {
  test.setTimeout(120_000)
  await abrir(page)
  await page.getByLabel('Preset').selectOption('leve')
  await soltarDimensoes(page)
  await page.getByLabel('Largura máxima').fill('100')
  await page.locator('#arquivo').setInputFiles(join(pasta, 'horizontal.png'))
  await page.getByRole('button', { name: 'Comprimir lote' }).click()
  const comparar = page.getByRole('button', { name: 'Comparar' })
  await comparar.click()
  await expect(page.getByRole('button', { name: 'Fechar' })).toBeFocused()
  const slider = page.getByRole('slider', { name: 'Posição da comparação' })
  for (let passo = 0; passo < 8 && !(await slider.evaluate((elemento) => elemento === document.activeElement)); passo += 1) {
    await page.keyboard.press('Tab')
  }
  await expect(slider).toBeFocused()
  const antes = Number(await slider.inputValue())
  await page.keyboard.press('ArrowRight')
  expect(Number(await slider.inputValue())).toBe(antes + 1)
  expect(await slider.evaluate((elemento) => getComputedStyle(elemento).outlineStyle)).not.toBe('none')
  await expect(page.locator('[data-teste="nota-escala"]')).toContainText('Em 100%')
  await expect(page.locator('[data-teste="vista"]')).toHaveCSS('background-image', /linear-gradient/)

  await page.getByRole('button', { name: '100%' }).click()
  await expect(page.locator('[data-teste="cena"]')).toHaveAttribute('data-escala', '1')
  const original = await medir(page, '[data-teste="original"]')
  const resultado = await medir(page, '[data-teste="resultado"]')
  expect(original.css).toBe(original.natural)
  expect(resultado.css).toBe(resultado.natural)
  expect(resultado.natural).toBe(100)
  expect(original.natural).toBe(200)

  const inicio = await caixas(page)
  const vista = page.locator('[data-teste="vista"]')
  const caixa = await vista.boundingBox()
  if (!caixa) throw new Error('A área de comparação não tem caixa.')
  await page.mouse.move(caixa.x + 40, caixa.y + 40)
  await page.mouse.down()
  await page.mouse.move(caixa.x + 90, caixa.y + 70)
  await page.mouse.up()
  const fim = await caixas(page)
  expect(fim.originalX - inicio.originalX).toBe(fim.resultadoX - inicio.resultadoX)
  expect(fim.originalY - inicio.originalY).toBe(fim.resultadoY - inicio.resultadoY)
  await expect(page.locator('[data-teste="cena"]')).not.toHaveAttribute('data-deslocamento', '0,0')

  await page.getByRole('button', { name: 'Ajustar à tela' }).click()
  await expect(page.locator('[data-teste="exibicao"]')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(comparar).toBeFocused()
})

async function abrir(page: Page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
}

async function soltarDimensoes(page: Page) {
  await page.getByRole('checkbox', { name: 'Manter dimensões originais' }).uncheck()
}

async function conferirSaida(
  page: Page,
  nome: string,
  limites: { largura: string; altura: string },
  largura: number,
  altura: number,
) {
  if ((await page.locator('[data-teste="linha"]').count()) > 0) {
    await page.getByRole('button', { name: 'Limpar' }).click()
  }
  await page.getByLabel('Largura máxima').fill(limites.largura)
  await page.getByLabel('Altura máxima').fill(limites.altura)
  await page.locator('#arquivo').setInputFiles(join(pasta, nome))
  await page.getByRole('button', { name: 'Comprimir lote' }).click()
  const linha = page.locator('[data-teste="linha"]')
  await expect(linha).toHaveAttribute('data-largura-saida', String(largura))
  await expect(linha).toHaveAttribute('data-altura-saida', String(altura))
  await expect(linha.locator('[data-teste="dimensoes"]')).toContainText(`${largura}×${altura}`)
  await page.getByRole('button', { name: 'Limpar' }).click()
}

function pixelsFaixa(): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(30 * 15 * 4)
  for (let y = 0; y < 15; y += 1) {
    for (let x = 0; x < 30; x += 1) {
      const indice = (y * 30 + x) * 4
      const vermelho = x === 7 || y === 3
      pixels[indice] = vermelho ? 255 : 0
      pixels[indice + 3] = 255
    }
  }
  return pixels
}

function canal(pixels: ArrayLike<number>, largura: number, x: number, y: number, canalPixel: number): number {
  return pixels[(y * largura + x) * 4 + canalPixel]
}

async function lerAmostra(page: Page, seletor: string) {
  const bruto = await page.locator(seletor).evaluate(async (img: HTMLImageElement) => {
    await img.decode()
    const tela = document.createElement('canvas')
    tela.width = img.naturalWidth
    tela.height = img.naturalHeight
    const contexto = tela.getContext('2d', { willReadFrequently: true })
    if (!contexto) throw new Error('Canvas indisponível.')
    contexto.drawImage(img, 0, 0)
    const dados = contexto.getImageData(0, 0, tela.width, tela.height).data
    let binario = ''
    const bloco = 0x8000
    for (let indice = 0; indice < dados.length; indice += bloco) {
      binario += String.fromCharCode(...dados.subarray(indice, indice + bloco))
    }
    return { largura: tela.width, altura: tela.height, base64: btoa(binario) }
  })
  return {
    largura: bruto.largura,
    altura: bruto.altura,
    pixels: Uint8Array.from(Buffer.from(bruto.base64, 'base64')),
  }
}

async function medir(page: Page, seletor: string) {
  return page.locator(seletor).evaluate((img: HTMLImageElement) => ({
    css: Math.round(img.getBoundingClientRect().width),
    natural: img.naturalWidth,
  }))
}

async function caixas(page: Page) {
  return page.evaluate(() => {
    const original = document.querySelector('[data-teste="original"]')
    const resultado = document.querySelector('[data-teste="resultado"]')
    if (!(original instanceof HTMLElement) || !(resultado instanceof HTMLElement)) {
      throw new Error('Imagens da comparação ausentes.')
    }
    const caixaOriginal = original.getBoundingClientRect()
    const caixaResultado = resultado.getBoundingClientRect()
    return {
      originalX: caixaOriginal.x,
      originalY: caixaOriginal.y,
      resultadoX: caixaResultado.x,
      resultadoY: caixaResultado.y,
    }
  })
}
