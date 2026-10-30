// Renders assets/icon.svg to the PNGs phones want on the home screen. Run after changing the icon.
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const svg = await readFile('assets/icon.svg', 'utf8');
const browser = await chromium.launch();
for (const size of [180, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<!doctype html><style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg.replace('rx="14"', 'rx="0"')}`);
  await page.screenshot({ path: `assets/icon-${size}.png` });
  await page.close();
}
await browser.close();
