import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { cpus, totalmem } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '../..')
const fixtures = join(raiz, 'tests/fixtures')

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (erro) => {
    console.log(`PAGEERROR ${erro.message}`)
  })
  const pedidos: string[] = []
  page.on('request', (pedido) => pedidos.push(pedido.url()))
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const externos = pedidos.filter((url) => !ehRecursoLocal(url))
  expect(externos).toEqual([])
})

test('empacota wasm no build e não aponta para CDN', () => {
  const arquivos = listar(join(raiz, 'dist'))
  const wasm = arquivos.filter((caminho) => caminho.endsWith('.wasm'))
  expect(wasm.length).toBeGreaterThanOrEqual(6)
  const textos = arquivos.filter((caminho) => caminho.endsWith('.js')).map((caminho) => readFileSync(caminho, 'utf8'))
  const juntos = textos.join('\n')
  expect(juntos).not.toContain('cdn.jsdelivr.net')
  expect(juntos).not.toContain('unpkg.com')
  expect(juntos).not.toContain('cdnjs.cloudflare.com')
})

test('otimiza PNG sem perdas e preserva os pixels', async ({ page }) => {
  await escolher(page, 'texto.png')
  await page.getByLabel('Formato de saída').selectOption('original')
  await processar(page)
  const original = await lerPixels(page, '[data-teste="original"]')
  const resultado = await lerPixels(page, '[data-teste="resultado"]')
  expect(resultado.largura).toBe(80)
  expect(resultado.altura).toBe(24)
  expect(resultado.pixels).toEqual(original.pixels)
  const bytes = await bytesDaImagem(page, '[data-teste="resultado"]')
  expect(bytes.slice(0, 4)).toEqual([137, 80, 78, 71])
  await expect(page.getByRole('status')).toContainText(/menor|Já estava otimizada/)
  await registrar(page, 'texto.png', 'oxipng manter formato')
})

test('preserva transparência ao converter para WebP', async ({ page }) => {
  await escolher(page, 'grafico-alpha.png')
  await page.getByLabel('Formato de saída').selectOption('webp')
  await processar(page)
  const resultado = await lerPixels(page, '[data-teste="resultado"]')
  expect(resultado.largura).toBe(32)
  expect(resultado.altura).toBe(32)
  expect(alpha(resultado.pixels, 32, 0, 0)).toBeLessThan(20)
  expect(alpha(resultado.pixels, 32, 16, 16)).toBeGreaterThan(240)
  const bytes = await bytesDaImagem(page, '[data-teste="resultado"]')
  expect(String.fromCharCode(...bytes.slice(0, 4))).toBe('RIFF')
  expect(String.fromCharCode(...bytes.slice(8, 12))).toBe('WEBP')
  await expect(page.locator('[data-teste="dimensoes"]')).toContainText('image/webp')
  await registrar(page, 'grafico-alpha.png', 'webp com alpha')
})

test('exige fundo antes de JPEG com transparência e gera MozJPEG', async ({ page }) => {
  await escolher(page, 'grafico-alpha.png')
  await page.getByLabel('Formato de saída').selectOption('jpeg')
  await page.getByRole('button', { name: 'Processar' }).click()
  await expect(page.getByRole('status')).toContainText('Escolha uma cor de fundo')
  await page.locator('#fundo').fill('#000000')
  await processar(page)
  const bytes = await bytesDaImagem(page, '[data-teste="resultado"]')
  expect(bytes[0]).toBe(0xff)
  expect(bytes[1]).toBe(0xd8)
  expect(temMarcadorAntesDoScan(bytes, 0xc2)).toBe(true)
  const pixels = await lerPixels(page, '[data-teste="resultado"]')
  expect(pixels.largura).toBe(32)
  expect(pixels.altura).toBe(32)
  expect(canal(pixels.pixels, 32, 0, 0, 0)).toBeLessThan(40)
  await expect(page.locator('[data-teste="baixar"]')).toHaveAttribute('download', /grafico-alpha\.jpg$/)
  await registrar(page, 'grafico-alpha.png', 'jpeg fundo #000000')
})

test('converte foto sintética para JPEG e reprocessa o arquivo gerado', async ({ page }) => {
  await escolher(page, 'foto-sintetica.png')
  await page.getByLabel('Formato de saída').selectOption('jpeg')
  await processar(page)
  const jpeg = Buffer.from(await bytesDaImagem(page, '[data-teste="resultado"]'))
  expect(jpeg[0]).toBe(0xff)
  await registrar(page, 'foto-sintetica.png', 'jpeg conversao')
  mkdirSync(join(raiz, 'test-results'), { recursive: true })
  const caminho = join(raiz, 'test-results/foto-sintetica.jpg')
  writeFileSync(caminho, jpeg)

  await escolherCaminho(page, caminho)
  await page.getByLabel('Formato de saída').selectOption('original')
  await processar(page)
  const saida = Buffer.from(await bytesDaImagem(page, '[data-teste="resultado"]'))
  expect(saida[0]).toBe(0xff)
  expect(saida[1]).toBe(0xd8)
  const pixels = await lerPixels(page, '[data-teste="resultado"]')
  expect(pixels.largura).toBe(48)
  expect(pixels.altura).toBe(48)
  const status = await page.getByRole('status').innerText()
  expect(status).toMatch(/menor|maior|Já estava otimizada|Mesmo tamanho/)
  await registrar(page, 'foto-sintetica.jpg', 'jpeg manter formato')
})

test('informa aumento quando a conversão explícita fica maior', async ({ page }) => {
  await escolher(page, 'foto-sintetica.png')
  await page.getByLabel('Formato de saída').selectOption('png')
  await processar(page)
  const entrada = Number(await page.locator('[data-teste="bytes-entrada"]').getAttribute('data-bytes'))
  const saida = Number(await page.locator('[data-teste="bytes-saida"]').getAttribute('data-bytes'))
  const texto = await page.getByRole('status').innerText()
  if (saida > entrada) expect(texto).toContain('maior')
  if (saida < entrada) expect(texto).toContain('menor')
  const bytes = await bytesDaImagem(page, '[data-teste="resultado"]')
  expect(bytes.slice(0, 4)).toEqual([137, 80, 78, 71])
  await registrar(page, 'foto-sintetica.png', 'png explicito')
})

test('rejeita animação e arquivo inválido sem gerar download', async ({ page }) => {
  await page.locator('#arquivo').setInputFiles(join(fixtures, 'animado.apng'))
  await expect(page.getByRole('status')).toContainText('animadas')
  await expect(page.locator('[data-teste="baixar"]')).toHaveCount(0)

  await page.locator('#arquivo').setInputFiles(join(fixtures, 'animado.webp'))
  await expect(page.getByRole('status')).toContainText('animadas')

  await page.locator('#arquivo').setInputFiles(join(fixtures, 'invalido.jpg'))
  await expect(page.getByRole('status')).toContainText('PNG, JPEG ou WebP')
  await expect(page.locator('[data-teste="resultado"]')).toHaveCount(0)
})

test('mede três execuções depois do aquecimento', async ({ page }) => {
  await escolher(page, 'texto.png')
  await page.getByLabel('Formato de saída').selectOption('original')
  await page.getByLabel('Preset').selectOption('equilibrado')
  await processar(page)
  const inicializacaoMs = Number((await page.locator('[data-teste="duracao"]').innerText()).replace(' ms', ''))

  const duracoes: number[] = []
  const tamanhos: number[] = []
  for (let vez = 0; vez < 3; vez += 1) {
    await processar(page)
    duracoes.push(Number((await page.locator('[data-teste="duracao"]').innerText()).replace(' ms', '')))
    tamanhos.push(Number(await page.locator('[data-teste="bytes-saida"]').getAttribute('data-bytes')))
  }

  const arquivo = readFileSync(join(fixtures, 'texto.png'))
  const ordenadas = [...duracoes].sort((a, b) => a - b)
  const medicao = {
    fixture: 'texto.png',
    sha256: createHash('sha256').update(arquivo).digest('hex'),
    bytesEntrada: arquivo.byteLength,
    bytesSaida: tamanhos,
    inicializacaoMs,
    duracoesMs: duracoes,
    medianaMs: ordenadas[1],
    navegador: await page.evaluate(() => navigator.userAgent),
    ramBytes: totalmem(),
    cpu: cpus()[0]?.model ?? 'desconhecido',
  }
  mkdirSync(join(raiz, 'test-results'), { recursive: true })
  writeFileSync(join(raiz, 'test-results/medicoes.json'), JSON.stringify(medicao, null, 2))
  expect(tamanhos.every((tamanho) => tamanho > 0)).toBe(true)
  expect(ordenadas[1]).toBeGreaterThan(0)
})

async function escolher(page: Page, nome: string) {
  await escolherCaminho(page, join(fixtures, nome))
}

async function escolherCaminho(page: Page, caminho: string) {
  await page.locator('#arquivo').setInputFiles(caminho)
  await expect(page.locator('[data-teste="original"]')).toBeVisible()
}

async function processar(page: Page) {
  const resultado = page.locator('[data-teste="resultado"]')
  const anterior = (await resultado.count()) > 0 ? await resultado.getAttribute('data-revisao') : null
  await page.getByRole('button', { name: 'Processar' }).click()
  await expect
    .poll(async () => page.locator('[data-teste="resultado"]').getAttribute('data-revisao'), {
      timeout: 60_000,
    })
    .not.toBe(anterior)
}

async function lerPixels(page: Page, seletor: string) {
  return page.locator(seletor).evaluate(async (img: HTMLImageElement) => {
    await img.decode()
    const tela = document.createElement('canvas')
    tela.width = img.naturalWidth
    tela.height = img.naturalHeight
    const contexto = tela.getContext('2d')
    if (!contexto) throw new Error('Canvas indisponível para leitura dos pixels.')
    contexto.drawImage(img, 0, 0)
    const dados = contexto.getImageData(0, 0, tela.width, tela.height)
    return {
      largura: tela.width,
      altura: tela.height,
      pixels: Array.from(dados.data),
    }
  })
}

async function bytesDaImagem(page: Page, seletor: string): Promise<number[]> {
  return page.locator(seletor).evaluate(async (img: HTMLImageElement) => {
    const resposta = await fetch(img.src)
    return Array.from(new Uint8Array(await resposta.arrayBuffer()))
  })
}

function alpha(pixels: number[], largura: number, x: number, y: number): number {
  return pixels[(y * largura + x) * 4 + 3]
}

function canal(pixels: number[], largura: number, x: number, y: number, canalPixel: number): number {
  return pixels[(y * largura + x) * 4 + canalPixel]
}

function temMarcadorAntesDoScan(bytes: number[], marcador: number): boolean {
  for (let indice = 0; indice < bytes.length - 1; indice += 1) {
    if (bytes[indice] === 0xff && bytes[indice + 1] === 0xda) return false
    if (bytes[indice] === 0xff && bytes[indice + 1] === marcador) return true
  }
  return false
}

async function registrar(page: Page, fixture: string, observacao: string) {
  const entrada = Number(await page.locator('[data-teste="bytes-entrada"]').getAttribute('data-bytes'))
  const saida = Number(await page.locator('[data-teste="bytes-saida"]').getAttribute('data-bytes'))
  const duracaoMs = Number((await page.locator('[data-teste="duracao"]').innerText()).replace(' ms', ''))
  const status = await page.getByRole('status').innerText()
  const caminho = join(raiz, 'test-results/amostras.json')
  mkdirSync(join(raiz, 'test-results'), { recursive: true })
  const atual = existsSync(caminho) ? (JSON.parse(readFileSync(caminho, 'utf8')) as unknown[]) : []
  atual.push({ fixture, observacao, entrada, saida, duracaoMs, status })
  writeFileSync(caminho, JSON.stringify(atual, null, 2))
}

function ehRecursoLocal(url: string): boolean {
  const host = new URL(url).hostname
  if (host === '127.0.0.1' || host === 'localhost') return true
  return host.endsWith('kaspersky-labs.com')
}

function listar(pasta: string): string[] {
  const encontrados: string[] = []
  for (const entrada of readdirSync(pasta, { withFileTypes: true })) {
    const caminho = join(pasta, entrada.name)
    if (entrada.isDirectory()) encontrados.push(...listar(caminho))
    else encontrados.push(caminho)
  }
  return encontrados
}
