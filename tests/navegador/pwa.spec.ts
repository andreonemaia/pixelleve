import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { cacheCobreCodecs } from '../../src/pwa/cache'
import { LIMITE_PRECACHE_BYTES } from '../../src/pwa/precache'
import { gradePng } from '../apoio/gradePng'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '../..')
const fixtures = join(raiz, 'tests/fixtures')
const swCaminho = join(raiz, 'dist/sw.js')
const extensoes = new Set(['.js', '.css', '.html', '.wasm', '.svg', '.png', '.ico', '.webmanifest'])

test('o manifest, os ícones e o precache cobrem a interface e os codecs', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-teste="offline"]')).toBeVisible({ timeout: 60_000 })
  const manifest = await page.evaluate(async () => {
    const resposta = await fetch('/manifest.webmanifest')
    if (!resposta.ok) throw new Error('Manifesto ausente.')
    return resposta.json() as Promise<{
      display: string
      icons: { src: string; sizes: string; purpose?: string }[]
    }>
  })
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons.map((icone) => icone.sizes).sort()).toEqual(['192x192', '512x512', '512x512'])
  expect(manifest.icons.some((icone) => icone.purpose === 'maskable')).toBe(true)
  for (const icone of manifest.icons) {
    const caminho = icone.src.startsWith('/') ? icone.src : `/${icone.src}`
    const bytes = await page.evaluate(async (src) => {
      const resposta = await fetch(src)
      return [...new Uint8Array(await resposta.arrayBuffer()).slice(0, 8)]
    }, caminho)
    expect(bytes.slice(0, 4)).toEqual([137, 80, 78, 71])
  }

  await page.reload()
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  await expect(page.locator('[data-teste="offline"]')).toBeVisible({ timeout: 60_000 })
  const urls = await urlsDoCache(page)
  expect(cacheCobreCodecs(urls)).toBe(true)
  const arquivos = listarDist(join(raiz, 'dist')).filter((caminho) => extensoes.has(extensaoDe(caminho)))
  expect(arquivos.length).toBeGreaterThan(0)
  for (const arquivo of arquivos) {
    expect(statSync(arquivo).size).toBeLessThanOrEqual(LIMITE_PRECACHE_BYTES)
    const nome = relative(join(raiz, 'dist'), arquivo).replaceAll('\\', '/')
    if (nome === 'sw.js' || /^workbox-[^/]+\.js$/.test(nome)) continue
    expect(urls.some((url) => url.endsWith(`/${nome}`) || url.endsWith(nome)), nome).toBe(true)
  }

  const instalar = page.getByRole('button', { name: 'Instalar aplicativo' })
  if ((await instalar.count()) > 0) await expect(instalar).toBeEnabled()
  else await expect(page.locator('[data-teste="orientacao-instalar"]')).toBeVisible()
  await expect(page.locator('[data-teste="atualizacao"]')).toHaveCount(0)

  const registro = await page.evaluate(async () => {
    const ativo = await navigator.serviceWorker.getRegistration()
    const bancos = 'databases' in indexedDB ? await indexedDB.databases() : []
    return {
      ativo: Boolean(ativo?.active),
      escopo: ativo?.scope ?? '',
      bancos: bancos.map((banco) => banco.name ?? ''),
      local: localStorage.length,
      sessao: sessionStorage.length,
    }
  })
  expect(registro.ativo).toBe(true)
  expect(registro.escopo).toContain('127.0.0.1')
  expect(registro.local).toBe(0)
  expect(registro.sessao).toBe(0)
  expect(registro.bancos.join(' ')).not.toMatch(/texto\.png|foto-sintetica|grafico-alpha/)
  expect(urls.join(' ')).not.toMatch(/texto\.png|foto-sintetica|grafico-alpha/)
})

test('reabre sem rede e processa JPEG e WebP que ainda não tinham sido usados', async ({ page }) => {
  test.setTimeout(180_000)
  const falhas: string[] = []
  page.on('pageerror', (erro) => falhas.push(erro.message))
  await page.goto('/')
  await expect(page.locator('[data-teste="offline"]')).toBeVisible({ timeout: 60_000 })
  await page.reload()
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  await page.locator('#arquivo').setInputFiles(join(fixtures, 'texto.png'))
  await page.getByLabel('Formato de saída').selectOption('original')
  await page.getByRole('button', { name: 'Comprimir lote' }).click()
  await expect(page.locator('[data-teste="linha"]')).toHaveAttribute('data-estado', /concluido|sem-reducao|maior/)

  await page.context().setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Imagens prontas para a web' })).toBeVisible()
  await expect(page.locator('[data-teste="offline"]')).toBeVisible()
  await expect(page.locator('[data-teste="linha"]')).toHaveCount(0)

  await page.locator('#arquivo').setInputFiles(join(fixtures, 'foto-sintetica.png'))
  await page.getByLabel('Formato de saída').selectOption('jpeg')
  await page.getByRole('button', { name: 'Comprimir lote' }).click()
  await expect(page.locator('[data-teste="linha"]').last()).toHaveAttribute('data-estado', /concluido|sem-reducao|maior/, { timeout: 60_000 })
  const jpeg = await bytesDoLink(page.locator('[data-teste="linha"]').last())
  expect(jpeg[0]).toBe(0xff)
  expect(jpeg[1]).toBe(0xd8)

  await page.locator('#arquivo').setInputFiles(join(fixtures, 'grafico-alpha.png'))
  await page.getByLabel('Formato de saída').selectOption('webp')
  await page.getByRole('button', { name: 'Comprimir lote' }).click()
  await expect(page.locator('[data-teste="linha"]').last()).toHaveAttribute('data-estado', /concluido|sem-reducao|maior/, { timeout: 60_000 })
  const webp = await bytesDoLink(page.locator('[data-teste="linha"]').last())
  expect(String.fromCharCode(...webp.slice(0, 4))).toBe('RIFF')
  expect(String.fromCharCode(...webp.slice(8, 12))).toBe('WEBP')

  await page.getByRole('checkbox', { name: 'Manter dimensões originais' }).uncheck()
  await page.getByLabel('Largura máxima').fill('24')
  await page.getByLabel('Formato de saída').selectOption('original')
  await page.locator('#arquivo').setInputFiles(join(fixtures, 'texto.png'))
  await page.getByRole('button', { name: 'Comprimir lote' }).click()
  const linha = page.locator('[data-teste="linha"]').last()
  await expect(linha).toHaveAttribute('data-largura-saida', '24', { timeout: 60_000 })
  await expect(linha).toHaveAttribute('data-altura-saida', '7')

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Baixar lote em ZIP' }).click(),
  ])
  expect((await download.path())?.length).toBeGreaterThan(0)
  const urls = await urlsDoCache(page)
  expect(urls.join(' ')).not.toMatch(/texto\.png|foto-sintetica|grafico-alpha/)
  expect(falhas).toEqual([])
})

test('a atualização fica avisada e não recarrega enquanto a fila trabalha', async ({ page }) => {
  test.setTimeout(180_000)
  const original = readFileSync(swCaminho)
  const grande = join(raiz, 'test-results/pwa-grande.png')
  writeFileSync(grande, gradePng(1600, 1200))
  let navegou = 0
  page.on('framenavigated', () => {
    navegou += 1
  })
  try {
    await page.goto('/')
    await expect(page.locator('[data-teste="offline"]')).toBeVisible({ timeout: 60_000 })
    writeFileSync(swCaminho, Buffer.concat([original, Buffer.from('\n// versao-teste\n')]))
    await page.evaluate(async () => {
      const registro = await navigator.serviceWorker.ready
      await registro.update()
    })
    await expect(page.locator('[data-teste="atualizacao"]')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('[data-teste="atualizar"]')).toBeEnabled()
    const antes = navegou
    await page.getByLabel('Preset').selectOption('maxima')
    await page.locator('#arquivo').setInputFiles(grande)
    await page.getByRole('button', { name: 'Comprimir lote' }).click()
    await expect(page.locator('[data-teste="linha"]')).toHaveAttribute('data-estado', 'processando')
    await expect(page.locator('[data-teste="atualizar"]')).toBeDisabled()
    await expect(page.locator('[data-teste="atualizacao"]')).toContainText('espera o lote')
    expect(navegou).toBe(antes)
    await expect(page.locator('[data-teste="linha"]')).toHaveCount(1)
  } finally {
    writeFileSync(swCaminho, original)
  }
})

test('cancelar a atualização preserva resultados concluídos', async ({ page }) => {
  test.setTimeout(180_000)
  const original = readFileSync(swCaminho)
  let navegou = 0
  page.on('framenavigated', () => {
    navegou += 1
  })
  try {
    await page.goto('/')
    await expect(page.locator('[data-teste="offline"]')).toBeVisible({ timeout: 60_000 })
    writeFileSync(swCaminho, Buffer.concat([original, Buffer.from('\n// versao-cancelar\n')]))
    await page.evaluate(async () => {
      const registro = await navigator.serviceWorker.ready
      await registro.update()
    })
    await expect(page.locator('[data-teste="atualizacao"]')).toBeVisible({ timeout: 30_000 })
    await page.locator('#arquivo').setInputFiles(join(fixtures, 'texto.png'))
    await page.getByRole('button', { name: 'Comprimir lote' }).click()
    await expect(page.locator('[data-teste="linha"]')).toHaveAttribute('data-estado', /concluido|sem-reducao|maior/)
    await expect(page.locator('[data-teste="perda-sessao"]')).toContainText('ainda não foi salvo')
    await expect(page.locator('[data-teste="atualizar"]')).toBeEnabled()
    const antes = navegou
    await page.getByRole('button', { name: 'Continuar nesta versão' }).click()
    await expect(page.locator('[data-teste="atualizacao"]')).toHaveCount(0)
    expect(navegou).toBe(antes)
    await expect(page.locator('[data-teste="linha"]')).toHaveCount(1)
    await expect(page.locator('[data-teste="offline"]')).toBeVisible()
  } finally {
    writeFileSync(swCaminho, original)
  }
})

test('aceitar a atualização recarrega e descarta a sessão concluída', async ({ page }) => {
  test.setTimeout(180_000)
  const original = readFileSync(swCaminho)
  try {
    await page.goto('/')
    await expect(page.locator('[data-teste="offline"]')).toBeVisible({ timeout: 60_000 })
    writeFileSync(swCaminho, Buffer.concat([original, Buffer.from('\n// versao-aceitar\n')]))
    await page.evaluate(async () => {
      const registro = await navigator.serviceWorker.ready
      await registro.update()
    })
    await expect(page.locator('[data-teste="atualizacao"]')).toBeVisible({ timeout: 30_000 })
    await page.locator('#arquivo').setInputFiles(join(fixtures, 'texto.png'))
    await page.getByRole('button', { name: 'Comprimir lote' }).click()
    await expect(page.locator('[data-teste="linha"]')).toHaveAttribute('data-estado', /concluido|sem-reducao|maior/)
    await expect(page.locator('[data-teste="perda-sessao"]')).toBeVisible()
    await Promise.all([
      page.waitForEvent('framenavigated'),
      page.getByRole('button', { name: 'Atualizar agora' }).click(),
    ])
    await expect(page.getByRole('heading', { name: 'Imagens prontas para a web' })).toBeVisible()
    await expect(page.locator('[data-teste="linha"]')).toHaveCount(0)
  } finally {
    writeFileSync(swCaminho, original)
  }
})

function listarDist(pasta: string): string[] {
  const saida: string[] = []
  for (const nome of readdirSync(pasta)) {
    const caminho = join(pasta, nome)
    if (statSync(caminho).isDirectory()) saida.push(...listarDist(caminho))
    else saida.push(caminho)
  }
  return saida
}

function extensaoDe(caminho: string): string {
  const ponto = caminho.lastIndexOf('.')
  return ponto >= 0 ? caminho.slice(ponto) : ''
}

async function urlsDoCache(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const urls: string[] = []
    const nomes = await caches.keys()
    for (const nome of nomes) {
      const cache = await caches.open(nome)
      for (const requisicao of await cache.keys()) urls.push(new URL(requisicao.url).pathname)
    }
    return urls
  })
}

async function bytesDoLink(linha: ReturnType<Page['locator']>): Promise<number[]> {
  return linha.locator('[data-teste="baixar"]').evaluate(async (ancora: HTMLAnchorElement) => {
    const resposta = await fetch(ancora.href)
    return [...new Uint8Array(await resposta.arrayBuffer())]
  })
}
