import { expect, test } from '@playwright/test';

test('carrossel de destaques troca produto por indicador e teclado', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const carousel = page.getByRole('region', { name: 'Destaques da Kurio' });
  const indicators = carousel.getByRole('button');
  await expect(indicators).toHaveCount(3);
  await expect(indicators.nth(0)).toHaveAttribute('aria-current', 'true');
  await expect
    .poll(() => indicators.nth(0).evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe('rgb(245, 241, 235)');
  await expect(carousel.getByText(/de 3$/)).toHaveCount(0);
  await indicators.nth(1).click();
  await expect(indicators.nth(1)).toHaveAttribute('aria-current', 'true');
  await expect
    .poll(() => indicators.nth(1).evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe('rgb(245, 241, 235)');
  await indicators.nth(1).press('ArrowRight');
  await expect(indicators.nth(2)).toHaveAttribute('aria-current', 'true');
  await expect
    .poll(() => indicators.nth(2).evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe('rgb(245, 241, 235)');
});

test('carrossel preserva a composição mobile sem overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'SEJA DONO DA CULTURA DIGITAL' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Destaques da Kurio' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
