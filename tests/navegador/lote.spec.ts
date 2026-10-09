import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { unzipSync } from 'fflate'
import { expect, test } from '@playwright/test'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '../..')
const fixtures = join(raiz, 'tests/fixtures')

test('importa várias imagens e uma pasta com subpastas', async ({ page }) => {
  const pedidos: string[] = []
  page.on('request', (pedido) => pedidos.push(pedido.url()))
  await page.goto('/')
  await page.locator('#arquivo').setInputFiles([
    join(fixtures, 'texto.png'),
    join(fixtures, 'grafico-alpha.png'),
  ])
  await expect(page.locator('[data-teste="linha"]')).toHaveCount(2)

  const base = join(raiz, 'test-results/pasta-lote')
  rmSync(base, { recursive: true, force: true })
  mkdirSync(join(base, 'sub/um'), { recursive: true })
  mkdirSync(join(base, 'sub/dois'), { recursive: true })
  mkdirSync(join(base, 'lote'), { recursive: true })
  cpSync(join(fixtures, 'texto.png'), join(base, 'sub/um/foto.png'))
  cpSync(join(fixtures, 'texto.png'), join(base, 'sub/dois/foto.png'))
  cpSync(join(fixtures, 'invalido.jpg'), join(base, 'meio.jpg'))
  writeFileSync(join(base, 'nota.txt'), 'nao-e-imagem')
  for (let indice = 0; indice < 105; indice += 1) {
    const nome = `f-${String(indice).padStart(3, '0')}.png`
    cpSync(join(fixtures, 'texto.png'), join(base, 'lote', nome))
  }

  await page.getByRole('button', { name: 'Limpar' }).click()
  await page.locator('#pasta').setInputFiles(base)
  await expect(page.locator('[data-teste="linha"]')).toHaveCount(108)
  await expect(page.locator('[data-teste="contagem"]')).toContainText('1 ignorados')
  const caminhos = await page.locator('[data-teste="linha"]').evaluateAll((elementos) =>
    elementos.map((elemento) => elemento.getAttribute('data-caminho') ?? ''),
  )
  expect(caminhos.filter((caminho) => caminho.endsWith('foto.png'))).toHaveLength(2)
  expect(caminhos.some((caminho) => caminho.includes('sub/um') || caminho.includes('sub\\um'))).toBe(true)
  expect(caminhos.some((caminho) => caminho.includes('lote/f-104.png') || caminho.includes('lote\\f-104.png'))).toBe(true)
  expect(pedidos.filter((url) => !ehLocal(url))).toEqual([])
})

test('uma falha no meio não interrompe o lote e o ZIP preserva as pastas', async ({ page }) => {
  const pedidos: string[] = []
  page.on('request', (pedido) => pedidos.push(pedido.url()))
  await page.goto('/')
  const base = join(raiz, 'test-results/pasta-zip')
  rmSync(base, { recursive: true, force: true })
  mkdirSync(join(base, 'sub/um'), { recursive: true })
  mkdirSync(join(base, 'sub/dois'), { recursive: true })
  cpSync(join(fixtures, 'texto.png'), join(base, 'sub/um/foto.png'))
  cpSync(join(fixtures, 'invalido.jpg'), join(base, 'meio.jpg'))
  cpSync(join(fixtures, 'grafico-alpha.png'), join(base, 'sub/dois/foto.png'))
  writeFileSync(join(base, 'nota.txt'), 'ignorar')

  await page.locator('#pasta').setInputFiles(base)
  await expect(page.locator('[data-teste="linha"]')).toHaveCount(3)
  await page.getByRole('button', { name: 'Comprimir lote' }).click()
  await expect.poll(async () => page.locator('[data-estado="aguardando"], [data-estado="processando"]').count()).toBe(0)
  await expect(page.locator('[data-estado="falha"]')).toHaveCount(1)
  await expect(page.locator('[data-teste="resumo"]')).toContainText('2 imagens')
  await expect(page.locator('[data-teste="resumo"]')).toContainText('Economizou')
  await expect(page.locator('[data-teste="progresso"]')).toContainText('3 de 3 imagens concluídas')
  await expect(page.getByRole('status')).toContainText('Economia do lote')

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Baixar lote em ZIP' }).click(),
  ])
  const arquivo = readFileSync(await download.path())
  const aberto = unzipSync(arquivo)
  const chaves = Object.keys(aberto)
  expect(chaves).toHaveLength(2)
  expect(chaves.some((chave) => chave.includes('sub/um') || chave.includes('sub\\um'))).toBe(true)
  expect(chaves.some((chave) => chave.includes('sub/dois') || chave.includes('sub\\dois'))).toBe(true)
  expect(chaves.some((chave) => chave.toLowerCase().includes('meio'))).toBe(false)
  await expect(page.getByText(/ficaram de fora por falha/)).toBeVisible()
  expect(pedidos.filter((url) => !ehLocal(url))).toEqual([])
})

function ehLocal(url: string): boolean {
  if (url.startsWith('blob:') || url.startsWith('data:')) return true
  const host = new URL(url).hostname
  return host === '127.0.0.1' || host === 'localhost' || host.endsWith('kaspersky-labs.com')
}
