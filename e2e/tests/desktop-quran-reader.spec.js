const { test, expect } = require('@playwright/test');
const { readerUrl, pause } = require('./quran');

test.afterEach(pause);

// The classic (desktop) reader shares the paging logic
test('desktop reader pages past the end of a short surah', async ({ page }) => {
  await page.goto(`${readerUrl(1)}&reader=auto`);
  await expect(page.getByText('﴿7﴾')).toBeVisible();
  await expect(page.locator('[data-ayah]')).toHaveCount(0); // not the mobile reader
  await page.getByRole('button', { name: 'Next →' }).click();
  await expect(page.getByRole('heading', { name: /2\./ })).toBeVisible();
  await expect(page.getByText('﴿10﴾')).toBeVisible();
  await page.getByRole('button', { name: '← Prev' }).click();
  await expect(page.getByRole('heading', { name: /1\./ })).toBeVisible();
});
