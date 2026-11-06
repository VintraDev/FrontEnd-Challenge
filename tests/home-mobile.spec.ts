import { expect, test } from '@playwright/test';

test('home mobile oferece busca, filtros acessíveis e navegação inferior', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'SEJA DONO DA CULTURA DIGITAL' })).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Navegação inferior' });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: 'Favoritos' })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir filtros' }).click();
  const sheet = page.getByRole('dialog', { name: 'Filtros' });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('checkbox', { name: 'Arte digital' }).check();
  await expect(page).toHaveURL(/categories=/);
  await page.keyboard.press('Escape');
  await expect(sheet).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Abrir filtros' })).toBeFocused();
  await expect(page.getByText('3 resultados')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('footer desktop contém as seções da referência', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const footer = page.locator('footer');
  await expect(footer.getByRole('heading', { name: 'Segurança da carteira' })).toBeVisible();
  const benefits = footer.locator('.footer-benefits');
  await expect(
    benefits.getByRole('button', { name: 'Saiba mais sobre segurança da carteira' }),
  ).toHaveCount(0);
  await expect(
    benefits.getByRole('button', { name: 'Saiba mais sobre criadores em destaque' }),
  ).toHaveCount(0);
  await expect(
    benefits.getByRole('button', { name: 'Saiba mais sobre alertas de lançamentos' }),
  ).toHaveCount(0);
  await expect(footer.getByRole('heading', { name: 'Central de ajuda' })).toBeVisible();
  await expect(footer.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  await expect(footer.getByText('© 2026 Kurio. Propriedade digital para todos.')).toBeVisible();
});

test('menu mobile destaca o catálogo e mostra a quantidade do carrinho', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/nft/nft-1');
  await page.getByRole('button', { name: 'ADICIONAR AO CARRINHO' }).click();
  await page.getByRole('link', { name: 'Ver carrinho' }).click();
  await page.getByRole('link', { name: 'Continuar explorando' }).click();
  const nav = page.getByRole('navigation', { name: 'Navegação inferior' });
  await expect(nav.getByRole('link', { name: 'Carrinho, 1 item' })).toBeVisible();
  await nav.getByRole('link', { name: 'Explorar NFTs' }).click();
  await expect(nav.getByRole('link', { name: 'Explorar NFTs' })).toHaveAttribute(
    'aria-current',
    'location',
  );
  await expect(nav.getByRole('link', { name: 'Início' })).not.toHaveAttribute(
    'aria-current',
    'page',
  );
  await nav.getByRole('link', { name: 'Início' }).click();
  await expect(nav.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page');
});

test('menu da conta mobile abre antes do logout e fecha com Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('ana@kurio.test');
  await page.getByLabel('Senha', { exact: true }).fill('KurioDemo123!');
  await page.getByRole('dialog').getByRole('button', { name: 'Entrar', exact: true }).click();
  const trigger = page.getByRole('button', { name: 'Abrir menu da conta' });
  await expect(trigger).toBeVisible();
  await trigger.click();
  const menu = page.getByRole('dialog', { name: 'Menu da conta' });
  await expect(menu.getByText('Ana Colecionadora')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await menu.getByRole('button', { name: 'Sair da conta' }).click();
  await expect(
    page
      .getByRole('navigation', { name: 'Navegação inferior' })
      .getByRole('link', { name: 'Entrar' }),
  ).toBeVisible();
});

for (const width of [320, 414]) {
  test(`cards editoriais e rodapé se ajustam à largura mobile em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 896 });
    await page.goto('/');
    for (const selector of ['.promos', '.journal-grid']) {
      const grid = page.locator(selector);
      const cards = grid.locator(selector === '.promos' ? 'article' : '[data-slot="card"]');
      const gridWidth = await grid.evaluate((element) => element.getBoundingClientRect().width);
      const bounds = await cards.evaluateAll((elements) =>
        elements.map((element) => ({
          width: element.getBoundingClientRect().width,
          top: element.getBoundingClientRect().top,
        })),
      );
      expect(bounds.length).toBeGreaterThan(1);
      for (let i = 0; i < bounds.length; i++) {
        expect(Math.abs(bounds[i].width - gridWidth)).toBeLessThan(1);
        if (i) expect(bounds[i].top).toBeGreaterThan(bounds[i - 1].top);
      }
    }
    const footer = page.locator('footer');
    await expect(footer.getByRole('heading', { name: 'Central de ajuda' })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy();
    await footer.getByRole('link', { name: 'Fotografia', exact: true }).click();
    await expect(page).toHaveURL(/categories=Fotografia/);
  });
}

test('rodapé compartilhado aparece no carrinho e detalhes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/cart', '/nft/nft-1']) {
    await page.goto(route);
    const footer = page.locator('footer');
    await expect(footer.getByRole('heading', { name: 'Central de ajuda' })).toBeVisible();
    await expect(footer.getByRole('button', { name: 'Central de ajuda' })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy();
  }
});
