import { expect, test } from '@playwright/test'

test('detalhe acessa a API, respeita estoque e navega entre NFTs', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const response = page.waitForResponse((result) => result.url().endsWith('/api/nfts/nft-1'))
  await page.goto('/nft/nft-1')
  expect((await response).status()).toBe(200)
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await expect(page.getByRole('button', { name: '1/1 esgotada' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '1/10' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await expect(page.locator('output')).toHaveText('2')
  await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled()
  await page.getByRole('button', { name: '1/50' }).click()
  await expect(page.locator('output')).toHaveText('1')
  await expect(page.getByRole('button', { name: 'ADICIONAR AO CARRINHO' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Favoritar' })).toBeDisabled()
  await page.getByRole('link', { name: /Sage Nomad #009/ }).click()
  await expect(page.getByRole('heading', { name: 'Sage Nomad #009' })).toBeVisible()
  await expect(page.getByText('1.69 ETH').first()).toBeVisible()
})

test('NFT inexistente apresenta recuperação', async ({ page }) => {
  await page.goto('/nft/inexistente')
  await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao catálogo' }).click()
  await expect(page.getByText('27 resultados')).toBeVisible()
})
