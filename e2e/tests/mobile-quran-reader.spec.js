const { test, expect } = require('@playwright/test');
const { readerUrl, ayahKeys } = require('./quran');

test.beforeEach(async ({ page }) => {
  // Per-device settings start from defaults (10 ayat per page, translation on)
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('e2e-init')) {
      localStorage.clear();
      sessionStorage.setItem('e2e-init', '1');
    }
  });
});

test('phones get the mobile reader with roots, word meanings and translation', async ({ page }) => {
  await page.goto(readerUrl(1));
  const first = page.locator('[data-ayah="1:1"]');
  await expect(first).toBeVisible();
  await expect(first.getByText('In (the) name')).toBeVisible(); // quran.com word meaning
  await expect(first.getByText(/In the name of All/)).toBeVisible(); // translation
  await expect(page.getByText(/Ayat 1–7 of 7/)).toBeVisible();
  expect(await ayahKeys(page)).toHaveLength(7);
});

test('Next surah at the end of al-Fatiha opens al-Baqarah with its basmala', async ({ page }) => {
  await page.goto(readerUrl(1));
  await page.getByRole('button', { name: 'Next surah ›' }).click();
  await expect(page.locator('[data-ayah="2:1"]')).toBeVisible();
  await expect(page.getByText(/Ayat 1–10 of 286/)).toBeVisible();
  await expect(page).toHaveURL(/surah=2/);
});

test('Continue and Previous page through a surah', async ({ page }) => {
  await page.goto(readerUrl(2));
  await expect(page.locator('[data-ayah="2:10"]')).toBeVisible();
  await page.getByRole('button', { name: 'Continue ›' }).click();
  await expect(page.locator('[data-ayah="2:11"]')).toBeAttached();
  expect(await ayahKeys(page)).toEqual(Array.from({ length: 10 }, (_, i) => `2:${i + 11}`));
  await page.getByRole('button', { name: '‹ Previous', exact: true }).click();
  await expect(page.locator('[data-ayah="2:1"]')).toBeAttached();
  await expect(page.locator('[data-ayah="2:11"]')).toHaveCount(0);
});

test('Previous surah opens the last page of the surah before', async ({ page }) => {
  await page.goto(readerUrl(3));
  await expect(page.locator('[data-ayah="3:1"]')).toBeVisible();
  await page.getByRole('button', { name: '‹ Previous surah' }).click();
  await expect(page.locator('[data-ayah="2:286"]')).toBeAttached();
  expect(await ayahKeys(page)).toEqual(Array.from({ length: 10 }, (_, i) => `2:${i + 277}`));
});

test('settings: ayat per page and go to ayah', async ({ page }) => {
  await page.goto(readerUrl(2));
  await expect(page.locator('[data-ayah="2:1"]')).toBeVisible();
  await page.getByLabel('Reader settings').first().click();
  await page.getByRole('button', { name: '5', exact: true }).click();
  await expect.poll(() => ayahKeys(page)).toEqual(['2:1', '2:2', '2:3', '2:4', '2:5']);

  await page.getByLabel('Go to ayah').fill('255');
  await page.getByRole('button', { name: 'Go', exact: true }).click();
  await expect(page.locator('[data-ayah="2:255"]')).toBeAttached();
  await expect(page).toHaveURL(/aya=255/);

  // The position and page size survive a reload
  await page.reload();
  await expect.poll(() => ayahKeys(page)).toEqual(['2:255', '2:256', '2:257', '2:258', '2:259']);
});

test('translation switch hides the translation', async ({ page }) => {
  await page.goto(readerUrl(1));
  const translation = page.getByText(/In the name of All/);
  await expect(translation).toBeVisible();
  await page.getByLabel('Reader settings').first().click();
  await page.getByRole('switch', { name: 'Translation' }).click();
  await expect(translation).toHaveCount(0);
});

test('playing an ayah starts the recitation', async ({ page }) => {
  await page.goto(readerUrl(1));
  await page.getByRole('button', { name: 'Play ayah 1:1' }).click();
  await expect(page.getByRole('button', { name: 'Stop ayah 1:1' })).toBeVisible();
  await expect
    .poll(() => page.locator('audio').evaluate((a) => a.currentTime), { timeout: 15_000 })
    .toBeGreaterThan(0.3);
  await page.getByRole('button', { name: 'Stop ayah 1:1' }).click();
  await expect(page.getByRole('button', { name: 'Play ayah 1:1' })).toBeVisible();
});

test('tapping a word opens it in the graph', async ({ page }) => {
  await page.goto(readerUrl(1));
  await page.locator('[data-ayah="1:2"]').getByRole('button').filter({ hasText: 'الْحَمْدُ' }).first().click();
  await expect(page).toHaveURL(/\/graph/);
});
