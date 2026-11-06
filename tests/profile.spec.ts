import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, email: string, password: string) {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('E-mail').fill(email);
  await dialog.getByLabel('Senha', { exact: true }).fill(password);
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click();
}

test('perfil exige sessão, persiste alterações e mantém isolamento entre contas', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/account');
  await expect(page).toHaveURL(/\/login\?redirect/);
  const unauthorized = await page.evaluate(async () => (await fetch('/api/profile')).status);
  expect(unauthorized).toBe(401);
  await login(page, 'ana@kurio.test', 'KurioDemo123!');
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible();
  await expect(page.locator('footer')).toHaveCount(0);
  await page.getByLabel('Nome de exibição').fill('Ana atualizada');
  await page.getByLabel('Nome ENS').fill('ana.eth');
  await page.getByRole('button', { name: 'Salvar perfil' }).click();
  await expect(page.getByRole('status')).toContainText('Perfil salvo.');
  await expect(page.getByRole('link', { name: 'Ana atualizada' })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana atualizada');
  await expect(page.getByLabel('Nome ENS')).toHaveValue('ana.eth');
  await page.screenshot({ path: '/tmp/kurio-profile-desktop.png', fullPage: true });
  await page
    .getByRole('navigation', { name: 'Menu da conta' })
    .getByRole('button', { name: 'Sair', exact: true })
    .click();
  await expect(page).toHaveURL(/\/login\?redirect/);
  await login(page, 'bruno@kurio.test', 'KurioDemo456!');
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Bruno Colecionador');
  await expect(page.getByLabel('Nome ENS')).toHaveValue('');
});

test('senha é validada e alterada para o usuário autenticado', async ({ page }) => {
  await page.goto('/account');
  await login(page, 'ana@kurio.test', 'KurioDemo123!');
  await page.getByRole('button', { name: 'Mostrar senha atual' }).click();
  await expect(page.getByLabel('Senha atual', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByLabel('Senha atual', { exact: true }).fill('senha-errada');
  await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha123!');
  await page.getByLabel('Confirmar nova senha', { exact: true }).fill('NovaSenha123!');
  await page.getByRole('button', { name: 'Alterar senha', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Senha atual incorreta');
  await page.getByLabel('Senha atual', { exact: true }).fill('KurioDemo123!');
  await page.getByRole('button', { name: 'Alterar senha', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Senha alterada.');
  await page
    .getByRole('navigation', { name: 'Menu da conta' })
    .getByRole('button', { name: 'Sair', exact: true })
    .click();
  await login(page, 'ana@kurio.test', 'NovaSenha123!');
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible();
});

test('e-mail é validado, detecta conflito e persiste na sessão', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await fetch('/api/__test/reset', { method: 'POST' });
  });
  await page.goto('/account');
  await login(page, 'ana@kurio.test', 'KurioDemo123!');
  const email = page.getByLabel('E-mail');
  await expect(email).toHaveValue('ana@kurio.test');
  await email.fill('bruno@kurio.test');
  await expect(email).toHaveValue('bruno@kurio.test');
  await page.getByRole('button', { name: 'Atualizar e-mail' }).click();
  await expect(page.getByRole('alert')).toContainText('já está em uso');
  await email.fill('ana.nova@kurio.test');
  await page.getByRole('button', { name: 'Atualizar e-mail' }).click();
  await expect(page.getByRole('status')).toContainText('E-mail atualizado.');
  await page.reload();
  await expect(email).toHaveValue('ana.nova@kurio.test');
});

test('perfil é utilizável no mobile', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/account');
  await login(page, 'ana@kurio.test', 'KurioDemo123!');
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible();
  await expect(page.locator('aside.profile-sidebar')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Abrir menu da conta' })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir menu da conta' }).click();
  const mobileNav = page.getByRole('navigation', { name: 'Menu da conta' });
  await expect(mobileNav).toBeVisible();
  await expect(mobileNav.getByRole('link', { name: 'Dados do perfil' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await page.getByRole('button', { name: 'Fechar' }).click();
  await expect(mobileNav).toBeHidden();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await page.getByLabel('Nome de exibição').fill('Ana mobile');
  await page.getByRole('button', { name: 'Salvar perfil' }).click();
  await expect(page.getByRole('status')).toContainText('Perfil salvo.');
});

test('avatar é salvo e removido pelo perfil da sessão', async ({ page }) => {
  await page.goto('/account');
  await login(page, 'ana@kurio.test', 'KurioDemo123!');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await expect(page.getByAltText('Avatar selecionado')).toBeVisible();
  await expect(page.getByAltText('Avatar selecionado')).toHaveAttribute(
    'src',
    /^data:image\/webp;base64,/,
  );
  await page.getByRole('button', { name: 'Salvar perfil' }).click();
  await expect(page.getByRole('status')).toContainText('Perfil salvo.');
  await page.reload();
  await expect(page.getByAltText('Avatar selecionado')).toBeVisible();
  await page.getByRole('button', { name: 'Remover', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar perfil' }).click();
  await expect(page.getByRole('status')).toContainText('Perfil salvo.');
  await page.reload();
  await expect(page.getByAltText('Avatar selecionado')).toHaveCount(0);
});
