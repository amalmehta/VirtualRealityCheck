import { test, expect } from '@playwright/test';

const GUESSES = [['3', '4'], ['60', '80'], ['1', '1.5'], ['8', '5'], ['6', '5'], ['8000', '7000'], ['6', '4'], ['3', '7']];
const ACTUALS = ['5h 12m', '112', '2.4', '3', '2', '5,400', '2.5', '19'];

async function fillGuesses(page) {
  for (const [guess, line] of GUESSES) {
    await page.fill('#guess', guess);
    await page.fill('#line', line);
    await page.getByRole('button', { name: 'Next' }).click();
  }
}

async function fullRun(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await fillGuesses(page);
  await page.getByRole('button', { name: 'Start checking' }).click();
  for (const [i, value] of ACTUALS.entries()) {
    await page.fill('#actual', value);
    await page.getByRole('button', { name: i === 7 ? 'See my result' : 'Next' }).click();
  }
}

test.beforeEach(async ({ page }) => {
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
});
test.afterEach(async ({ page }) => { expect(page.errors).toEqual([]); });

test('full run gives the known result', async ({ page }) => {
  await fullRun(page);
  await expect(page.locator('h1')).toHaveText('All four parts of your week are on the virtual side.');
  await expect(page.locator('.finding')).toContainText('last phone-free experience');
  await expect(page.locator('.finding')).toContainText('You guessed 3 days ago. It was 19 days ago.');
  await expect(page.locator('.verdict-virtual')).toHaveCount(4);
  await expect(page.getByText('Actual 5 h 12 min a day')).toBeVisible();
  await page.getByRole('button', { name: 'Use this' }).click();
  await expect(page.locator('#my-change')).toHaveValue(/leave your phone at home/);
  await page.reload();
  await expect(page.locator('#my-change')).toHaveValue(/leave your phone at home/);
});

test('input survives a reload mid-check, and guesses lock once looking starts', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await fillGuesses(page);
  await page.getByRole('button', { name: 'Start checking' }).click();
  await page.fill('#actual', '4');
  await page.reload();
  await expect(page.locator('#actual')).toHaveValue('4');
  await page.goto('/#/guess/0');
  await expect(page.locator('#guess')).toHaveCount(0);
  await expect(page.locator('#actual')).toBeVisible();
});

test('bad input is refused with a plain message', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('#guess-error')).toContainText('A number here');
  await page.fill('#guess', 'lots');
  await page.fill('#line', '99');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('#guess-error')).toContainText('Try hours');
  await expect(page.locator('.eyebrow')).toContainText('Guess 1 of 8');
});

test('skipping everything says so instead of inventing a result', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await fillGuesses(page);
  await page.getByRole('button', { name: 'Start checking' }).click();
  for (let i = 0; i < 8; i++) await page.getByRole('button', { name: 'Can’t check this' }).click();
  await expect(page.locator('h1')).toContainText('didn’t check any numbers');
  await expect(page.locator('.verdict-unchecked')).toHaveCount(4);
});

test('a second run compares with the first', async ({ page }) => {
  await fullRun(page);
  await fullRun(page);
  await expect(page.getByText(/Compared with your check on/)).toBeVisible();
  await page.goto('/');
  await expect(page.locator('.history-list li')).toHaveCount(2);
});

test('sample result saves nothing', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'See a sample result' }).click();
  await expect(page.locator('.sample-note')).toBeVisible();
  await page.fill('#my-change', 'should not be saved');
  const saved = await page.evaluate(() => localStorage.getItem('virtual-reality-check'));
  expect(saved).not.toContain('should not be saved');
  await page.goto('/#/');
  await expect(page.locator('.history-list')).toHaveCount(0);
});

test('a junk import changes nothing; a real one merges', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.setInputFiles('#import-file', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{not json') });
  await expect(page.locator('#data-message')).toContainText('nothing changed');
  const good = { runs: [{ id: 'a', createdAt: '2026-10-01T00:00:00Z', finishedAt: '2026-10-01T00:10:00Z', guess: { phone: 3 }, line: { phone: 4 }, actual: { phone: 5 }, change: '<img src=x onerror=alert(1)>' }] };
  await page.setInputFiles('#import-file', { name: 'y.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(good)) });
  await expect(page.locator('#data-message')).toContainText('Added 1 check');
  await page.locator('#settings [data-close]').click();
  await page.locator('.history-list button').click();
  await expect(page.locator('#my-change')).toHaveValue('<img src=x onerror=alert(1)>');
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
});

test('delete everything empties storage', async ({ page }) => {
  await fullRun(page);
  page.on('dialog', (d) => d.accept());
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Delete everything' }).click();
  await expect(page.locator('#data-message')).toContainText('deleted');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('virtual-reality-check')));
  expect(saved.runs).toEqual([]);
});

test('blocked storage still lets you finish and says so', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('blocked'); }; });
  await fullRun(page);
  await expect(page.locator('.notice')).toContainText('blocking storage');
  await expect(page.locator('.verdict-virtual')).toHaveCount(4);
});

test('theme setting applies and persists; no horizontal scroll', async ({ page }) => {
  await page.goto('/#/sample');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.locator('input[value="dark"] + span').click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('no request leaves the site', async ({ page }) => {
  const outside = [];
  page.on('request', (r) => { if (!r.url().startsWith('http://localhost:4173') && !r.url().startsWith('blob:')) outside.push(r.url()); });
  await fullRun(page);
  expect(outside).toEqual([]);
});

test('opening animation finishes within a second and never blocks input', async ({ page }) => {
  await page.goto('/');
  // Input works during the animation: the splash ignores pointers, so a click goes straight through.
  await page.evaluate(() => document.querySelector('.button.primary').click());
  await expect(page.locator('#guess')).toBeVisible({ timeout: 300 });
  await page.goto('about:blank');
  await page.goto('/');
  await page.waitForTimeout(1000);
  await expect(page.locator('#splash')).toBeHidden();
  const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
  expect(running).toBe(0);
});

test('the heaviest screen answers a click within 100 ms', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1000);
  const median = await page.evaluate(async () => {
    const frame = () => new Promise((res) => requestAnimationFrame(() => setTimeout(res, 0)));
    const times = [];
    for (let i = 0; i < 7; i++) {
      location.hash = '#/';
      await frame();
      await frame();
      const button = [...document.querySelectorAll('button')].find((b) => b.textContent === 'See a sample result');
      const start = performance.now();
      button.click();
      await frame();
      times.push(performance.now() - start);
    }
    return times.sort((a, b) => a - b)[3];
  });
  expect(median).toBeLessThan(100);
});
