const { test, expect } = require('@playwright/test');
const { readerUrl, pause } = require('./quran');

test.afterEach(pause);

// Waits until the force layout stops moving, then counts pairs of node labels
// (and labels vs other nodes' circles) that overlap by more than 2 px.
const settledOverlaps = async (page) => {
  let last = null;
  for (let i = 0; i < 40; i += 1) {
    const pos = await page.locator('svg .labels text').evaluateAll((els) =>
      els.map((el) => [el.getAttribute('x'), el.getAttribute('y')].join(',')).join(';')
    );
    if (pos === last) break;
    last = pos;
    await page.waitForTimeout(750);
  }
  return page.evaluate(() => {
    const rect = (el) => el.getBoundingClientRect();
    const labels = [...document.querySelectorAll('svg .labels text')].map(rect);
    const circles = [...document.querySelectorAll('svg .nodes circle')].map(rect);
    const overlap = (a, b) =>
      Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 &&
      Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;
    let pairs = 0;
    for (let i = 0; i < labels.length; i += 1) {
      for (let j = i + 1; j < labels.length; j += 1) if (overlap(labels[i], labels[j])) pairs += 1;
      circles.forEach((c, j) => {
        if (j !== i && overlap(labels[i], c)) pairs += 1;
      });
    }
    return { pairs, labels: labels.length };
  });
};

test('graph labels do not overlap, before or after expanding a root', async ({ page }) => {
  await page.goto(`${readerUrl(1)}&reader=auto`);
  await expect(page.getByText('﴿7﴾')).toBeVisible();
  await page.locator('.arabic span.cursor-pointer').nth(2).click(); // third word of al-Fatiha
  await expect(page).toHaveURL(/\/graph/);
  await expect(page.locator('svg .nodes circle').first()).toBeVisible();

  const first = await settledOverlaps(page);
  expect(first.labels).toBeGreaterThan(1);
  expect(first.pairs).toBe(0);

  // Expand the root (green) into its words
  const before = await page.locator('svg .nodes circle').count();
  await page.locator('svg .nodes circle[fill="green"]').first().click({ force: true });
  await expect.poll(() => page.locator('svg .nodes circle').count()).toBeGreaterThan(before);
  const expanded = await settledOverlaps(page);
  expect(expanded.pairs).toBe(0);
});
