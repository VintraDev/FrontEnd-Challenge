import { expect, test } from '@playwright/test'

for (const width of [320, 390, 414]) {
  test(`carrinho mobile mantém ações acessíveis em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 896 })
    await page.goto('/nft/nft-1')
    await page.getByRole('button', { name: 'ADICIONAR AO CARRINHO' }).click()
    await page.getByRole('link', { name: 'Ver carrinho' }).click()
    await expect(page.getByRole('heading', { name: 'Carrinho de NFTs', exact: true, visible: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Voltar ao catálogo' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Itens do carrinho' }).getByText('Emerald Ape #042')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.getByRole('button', { name: 'Aumentar Emerald Ape #042' }).click()
    await expect(page.getByText('2.396 ETH')).toBeVisible()
    await page.getByLabel('Código promocional').fill('KURIO10')
    await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
    await expect(page.getByText('2.158 ETH')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Revisar pagamento' })).toBeVisible()
    await page.getByRole('button', { name: 'Remover Emerald Ape #042' }).click()
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
    await page.getByRole('link', { name: 'Voltar ao catálogo' }).click()
    await expect(page.getByText('27 resultados')).toBeVisible()
  })
}
