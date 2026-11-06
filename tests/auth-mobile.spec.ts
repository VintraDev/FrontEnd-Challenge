import { expect, test } from '@playwright/test';

for (const width of [320, 390, 414]) {
  test(`login e cadastro mobile mantêm navegação e campos acessíveis em ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 896 });
    await page.goto('/login?redirect=%2Fcheckout');
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Entrar' })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy();
    const bounds = await dialog.boundingBox();
    expect(bounds?.width).toBe(width);
    await page.getByRole('link', { name: 'Crie uma conta' }).click();
    await expect(page).toHaveURL(/\/register\?redirect/);
    await expect(page.getByRole('heading', { name: 'Criar perfil de colecionador' })).toBeVisible();
    await page.getByLabel('Nome de usuário').fill('Usuário Mobile');
    await page.getByLabel('E-mail').fill(`mobile${width}@kurio.test`);
    await page.getByLabel('Senha', { exact: true }).fill('SenhaFicticia123!');
    await page.getByRole('button', { name: 'Mostrar senha', exact: true }).click();
    await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'text');
    await page.getByLabel('Confirmar senha').fill('SenhaFicticia123!');
    if (width === 414) await page.screenshot({ path: '/tmp/kurio-register-responsive.png' });
    await page.getByRole('button', { name: 'Criar perfil', exact: true }).click();
    await expect(page).toHaveURL(/\/checkout$/);
  });
}
