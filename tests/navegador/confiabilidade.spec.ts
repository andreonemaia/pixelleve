import { createHash } from 'node:crypto'
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { unzipSync } from 'fflate'
import { expect, test, type Page } from '@playwright/test'
import { compararPixels } from '../../src/core/pixels'
import { formatarTamanho } from '../../src/core/tamanhos'
import { gradePng } from '../apoio/gradePng'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '../..')
const fixtures = join(raiz, 'tests/fixtures')
const pasta = join(raiz, 'test-results/confiabilidade')

test.beforeAll(() => {
  rmSync(pasta, { recursive: true, force: true })
  mkdirSync(pasta, { recursive: true })
  writeFileSync(join(pasta, 'grade-media.png'), gradePng(640, 480))
  writeFileSync(join(pasta, 'grade-grande.png'), gradePng(1600, 1200))
})

test('processa grades sintéticas maiores em sequência e reprocessa o original', async ({ page }) => {
  test.setTimeout(180_000)
  const pedidos: string[] = []
  page.on('request', (pedido) => pedidos.push(pedido.url()))
  await page.goto('/')
  mkdirSync(join(pasta, 'lote/a'), { recursive: true })
  mkdirSync(join(pasta, 'lote/meio'), { recursive: true })
  mkdirSync(join(pasta, 'lote/b'), { recursive: true })
  cpSync(join(pasta, 'grade-media.png'), join(pasta, 'lote/a/grade-a.png'))
  cpSync(join(fixtures, 'invalido.jpg'), join(pasta, 'lote/meio/invalido.jpg'))
  cpSync(join(pasta, 'grade-media.png'), join(pasta, 'lote/b/grade-b.png'))
  await page.locator('#pasta').setInputFiles(join(pasta, 'lote'))
  await expect(page.locator('[data-teste="linha"]')).toHaveCount(3)
  await page.getByLabel('Formato de saída').selectOption('original')
  await page.getByLabel('Preset').selectOption('equilibrado')
  await prepararQuadros(page)
  const inicio = Date.now()
  await page.getByRole('button', { name: 'Comprimir lote' }).click()
  await expect.poll(async () => page.locator('[data-estado="aguardando"], [data-estado="processando"]').count(), { timeout: 120_000 }).toBe(0)
  const duracaoLoteMs = Date.now() - inicio
  const quadros = await lerQuadros(page)
  await expect(page.locator('[data-estado="falha"]')).toHaveCount(1)
  await expect(page.locator('[data-teste="progresso"]')).toContainText('3 de 3 imagens concluídas')

  const linha = page.locator('[data-teste="linha"][data-caminho$="grade-a.png"]')
  await linha.getByRole('button', { name: 'Comparar' }).click()
  const original = await lerAmostra(page, '[data-teste="original"]')
  const resultado = await lerAmostra(page, '[data-teste="resultado"]')
  const pixels = compararPixels(original, resultado)
  expect(pixels).toEqual({ iguais: true, motivo: 'iguais' })
  expect(original.pixels[3]).toBe(0)
  await page.getByRole('button', { name: 'Fechar' }).click()

  const entrada = Number(await linha.getAttribute('data-bytes-entrada'))
  const saida = Number(await linha.getAttribute('data-bytes-saida'))
  const duracaoMs = Number((await linha.locator('[data-teste="duracao"]').innerText()).replace(' ms', ''))
  const anterior = await linha.getAttribute('data-conclusao')
  await linha.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect.poll(async () => linha.getAttribute('data-conclusao'), { timeout: 120_000 }).not.toBe(anterior)
  expect(Number(await linha.getAttribute('data-bytes-entrada'))).toBe(entrada)
  expect(Number(await linha.getAttribute('data-bytes-saida'))).toBe(saida)
  await expect(linha).toContainText('Economizou')
  expect(pedidos.filter((url) => !ehLocal(url))).toEqual([])
  anotar({
    caso: 'grade-media',
    sha256: createHash('sha256').update(readFileSync(join(pasta, 'grade-media.png'))).digest('hex'),
    largura: 640,
    altura: 480,
    bytesEntrada: entrada,
    bytesSaida: saida,
    duracaoMs,
    duracaoLoteMs,
    quadros,
    pixelsIguais: pixels.iguais,
    comparacaoPixels: 'cada canal RGBA no tamanho natural, via canvas',
    alphaCanto: original.pixels[3],
    observacao: 'PNG sintético com barras, gradiente e canto transparente. Não é fotografia nem captura de tela.',
  })
})

test('cancela durante o codec e a tentativa seguinte usa a configuração nova', async ({ page }) => {
  test.setTimeout(180_000)
  await page.goto('/')
  await page.locator('#arquivo').setInputFiles([join(pasta, 'grade-grande.png'), join(fixtures, 'texto.png')])
  await expect(page.locator('[data-teste="linha"]')).toHaveCount(2)
  await page.getByLabel('Formato de saída').selectOption('original')
  await page.getByLabel('Preset').selectOption('maxima')
  const grande = page.locator('[data-teste="linha"]').nth(0)
  const pequena = page.locator('[data-teste="linha"]').nth(1)
  await prepararQuadros(page)
  await page.getByRole('button', { name: 'Comprimir lote' }).click()
  await expect(grande).toHaveAttribute('data-estado', 'processando', { timeout: 30_000 })
  const quadrosNoMeio = await lerQuadros(page)
  await page.waitForTimeout(500)
  const estadoNoMeio = await grande.getAttribute('data-estado')
  const quadrosDepois = await lerQuadros(page)
  await page.getByLabel('Formato de saída').selectOption('webp')
  await page.getByLabel('Preset').selectOption('leve')
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(grande).toHaveAttribute('data-estado', 'cancelado')
  await expect(grande.locator('[data-teste="baixar"]')).toHaveCount(0)
  await page.waitForTimeout(2_000)
  await expect(grande).toHaveAttribute('data-estado', 'cancelado')
  await expect(grande.locator('[data-teste="baixar"]')).toHaveCount(0)
  await expect(pequena).toHaveAttribute('data-estado', 'aguardando')

  const antes = await grande.getAttribute('data-conclusao')
  await grande.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect.poll(async () => grande.getAttribute('data-conclusao'), { timeout: 120_000 }).not.toBe(antes)
  await expect(grande).toHaveAttribute('data-estado', /concluido|maior|sem-reducao/)
  await expect(pequena).toHaveAttribute('data-estado', /concluido|maior|sem-reducao/, { timeout: 120_000 })
  const baixado = await bytesDoLink(grande)
  expect(String.fromCharCode(...baixado.slice(0, 4))).toBe('RIFF')
  expect(String.fromCharCode(...baixado.slice(8, 12))).toBe('WEBP')
  expect(baixado.length).toBe(Number(await grande.getAttribute('data-bytes-saida')))
  const pequenaBytes = await bytesDoLink(pequena)
  expect(String.fromCharCode(...pequenaBytes.slice(0, 4))).toBe('RIFF')
  expect(String.fromCharCode(...pequenaBytes.slice(8, 12))).toBe('WEBP')
  anotar({
    caso: 'cancelamento-grade-grande',
    sha256: createHash('sha256').update(readFileSync(join(pasta, 'grade-grande.png'))).digest('hex'),
    largura: 1600,
    altura: 1200,
    bytesEntrada: Number(await grande.getAttribute('data-bytes-entrada')),
    bytesSaidaWebp: baixado.length,
    duracaoWebpMs: Number((await grande.locator('[data-teste="duracao"]').innerText()).replace(' ms', '')),
    estadoNoMeio,
    quadrosNoMeio,
    quadrosDepois,
    observacao: 'Cancelado no OxiPNG em preset Máxima. A nova tentativa saiu em WebP no preset Leve. A grade é sintética.',
  })
})

test('o ZIP preserva colisões de conversão e não redefine a economia', async ({ page }) => {
  test.setTimeout(180_000)
  await page.goto('/')
  await page.locator('#arquivo').setInputFiles(join(fixtures, 'foto-sintetica.png'))
  await page.getByLabel('Formato de saída').selectOption('jpeg')
  await page.getByRole('button', { name: 'Comprimir lote' }).click()
  await expect(page.locator('[data-teste="linha"]')).toHaveAttribute('data-estado', /concluido|sem-reducao|maior/)
  const jpeg = Buffer.from(await bytesDoLink(page.locator('[data-teste="linha"]')))
  const album = join(pasta, 'album')
  mkdirSync(join(album, 'dup'), { recursive: true })
  mkdirSync(join(album, 'outra'), { recursive: true })
  writeFileSync(join(album, 'dup/foto.jpg'), jpeg)
  cpSync(join(fixtures, 'texto.png'), join(album, 'dup/foto.png'))
  cpSync(join(pasta, 'grade-media.png'), join(album, 'outra/grade.png'))
  await page.getByRole('button', { name: 'Limpar' }).click()
  await page.locator('#pasta').setInputFiles(album)
  await expect(page.locator('[data-teste="linha"]')).toHaveCount(3)
  await page.getByLabel('Formato de saída').selectOption('webp')
  await page.getByRole('button', { name: 'Comprimir lote' }).click()
  await expect.poll(async () => page.locator('[data-estado="aguardando"], [data-estado="processando"]').count(), { timeout: 120_000 }).toBe(0)
  const saidas = (await page.locator('[data-teste="linha"]').evaluateAll((elementos) =>
    elementos.map((elemento) => Number(elemento.getAttribute('data-bytes-saida'))),
  )).filter((valor) => valor > 0)
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Baixar lote em ZIP' }).click(),
  ])
  const arquivoZip = readFileSync(await download.path())
  const aberto = unzipSync(arquivoZip)
  const chaves = Object.keys(aberto)
  expect(chaves.filter((chave) => chave.endsWith('foto.webp') || chave.endsWith('foto (2).webp'))).toHaveLength(2)
  expect(chaves.some((chave) => chave.includes('outra'))).toBe(true)
  const extraidos = Object.values(aberto).map((bytes) => bytes.length)
  expect([...extraidos].sort((a, b) => a - b)).toEqual([...saidas].sort((a, b) => a - b))
  const somaImagens = saidas.reduce((total, valor) => total + valor, 0)
  expect(arquivoZip.byteLength).toBeGreaterThan(somaImagens)
  const status = await page.getByRole('status').innerText()
  expect(status).toContain(formatarTamanho(somaImagens))
  if (formatarTamanho(arquivoZip.byteLength) !== formatarTamanho(somaImagens)) {
    expect(status).not.toContain(formatarTamanho(arquivoZip.byteLength))
  }
  anotar({
    caso: 'zip',
    somaBytesImagens: somaImagens,
    bytesArquivoZip: arquivoZip.byteLength,
    caminhos: chaves,
  })
})

test('arrasta um arquivo para a área de entrada', async ({ page }) => {
  await page.goto('/')
  const bytes = [...readFileSync(join(fixtures, 'texto.png'))]
  const dataTransfer = await page.evaluateHandle((lista: number[]) => {
    const transferencia = new DataTransfer()
    transferencia.items.add(new File([new Uint8Array(lista)], 'texto.png', { type: 'image/png' }))
    return transferencia
  }, bytes)
  await page.locator('.entrada').dispatchEvent('drop', { dataTransfer })
  await expect(page.locator('[data-teste="linha"]')).toHaveCount(1)
})

async function prepararQuadros(page: Page) {
  await page.evaluate(() => {
    const estado = { quadros: 0 }
    ;(window as unknown as { __quadros: { quadros: number } }).__quadros = estado
    const loop = () => {
      estado.quadros += 1
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  })
}

async function lerQuadros(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __quadros: { quadros: number } }).__quadros.quadros)
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

async function bytesDoLink(linha: ReturnType<Page['locator']>): Promise<number[]> {
  return linha.locator('[data-teste="baixar"]').evaluate(async (ancora: HTMLAnchorElement) => {
    const resposta = await fetch(ancora.href)
    return [...new Uint8Array(await resposta.arrayBuffer())]
  })
}

function anotar(entrada: Record<string, unknown> & { caso: string }) {
  mkdirSync(join(raiz, 'test-results'), { recursive: true })
  writeFileSync(join(raiz, 'test-results', `confiabilidade-${entrada.caso}.json`), JSON.stringify(entrada, null, 2))
}

function ehLocal(url: string): boolean {
  if (url.startsWith('blob:') || url.startsWith('data:')) return true
  const host = new URL(url).hostname
  return host === '127.0.0.1' || host === 'localhost' || host.endsWith('kaspersky-labs.com')
}
