import { expect, test } from '@playwright/test';

for (const width of [390, 768, 1440]) {
  test(`fundação visual usa tokens e cabe em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/diagnostics');
    await expect(page.getByText('REST: ok (msw)')).toBeVisible();
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(20, 13, 10)');
    await expect(page.locator('body')).toHaveCSS('font-family', /Roboto Mono/);
    expect(
      await page.evaluate(async () => {
        await document.fonts.ready;
        return document.fonts.check('16px "Roboto Mono"');
      }),
    ).toBe(true);
    await expect(page.getByRole('region', { name: 'Diagnóstico de rede' })).toHaveCSS(
      'background-color',
      'rgb(36, 22, 18)',
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.keyboard.press('Tab');
    const button = page.getByRole('button', { name: 'Reconectar teste' });
    await expect(button).toBeFocused();
    await expect(button).toHaveCSS('outline-style', 'solid');
    expect(
      await button.evaluate((element) => element.getBoundingClientRect().height),
    ).toBeGreaterThanOrEqual(48);
  });
}
