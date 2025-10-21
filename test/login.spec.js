import { test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:8081/login');
  await page.locator('input[type="email"]').click();
  await page.locator('input[type="email"]').fill('albertosolanov2');
  await page.locator('input[type="email"]').press('Alt+q');
  await page.locator('input[type="email"]').fill('albertosolanov2@gmail.com');
  await page.locator('input[type="email"]').press('Tab');
  await page.locator('input[type="password"]').press('CapsLock');
  await page.locator('input[type="password"]').fill('C');
  await page.locator('input[type="password"]').press('CapsLock');
  await page.locator('input[type="password"]').fill('Contra123456e');
  await page.getByRole('button').filter({ hasText: '󰈈' }).click();
  await page.getByTestId('button').click();
  await page.getByRole('tab', { name: '  Perfil' }).click();
});