// Rasterize the delivery-map SVGs in Chromium with the site's own fonts and write WebP files.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const svgDir = path.join(here, '.data', 'out');
const outDir = path.join(root, 'public', 'images', 'delivery');
const require = createRequire(path.join(root, 'package.json'));
const sharp = require('sharp');
const { chromium } = require('playwright');

const fonts = [
  '@fontsource/manrope/cyrillic-600.css',
  '@fontsource/manrope/latin-600.css',
  '@fontsource/manrope/cyrillic-700.css',
  '@fontsource/manrope/latin-700.css',
  '@fontsource/cormorant-garamond/cyrillic-500.css',
  '@fontsource/cormorant-garamond/latin-500.css',
  '@fontsource/cormorant-garamond/cyrillic-500-italic.css',
  '@fontsource/cormorant-garamond/latin-500-italic.css',
].map((file) => `<link rel="stylesheet" href="${pathToFileURL(path.join(root, 'node_modules', file)).href}">`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2400, height: 1600 } });
for (const lang of ['bg', 'en']) {
  const svg = readFileSync(path.join(svgDir, `delivery-zones-${lang}.svg`), 'utf8');
  const htmlFile = path.join(svgDir, `delivery-zones-${lang}.html`);
  writeFileSync(
    htmlFile,
    `<!doctype html><html><head><meta charset="utf-8">${fonts.join('')}
<style>html,body{margin:0;background:#121210}svg{display:block}</style></head><body>${svg}</body></html>`,
  );
  await page.goto(pathToFileURL(htmlFile).href);
  await page.evaluate(async () => {
    const faces = ['600 20px Manrope', '700 20px Manrope', "500 20px 'Cormorant Garamond'"];
    await Promise.all([...faces, "italic 500 20px 'Cormorant Garamond'"].map((face) => document.fonts.load(face, 'Аа')));
    await document.fonts.ready;
  });
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: 2400, height: 1600 } });
  await sharp(png).webp({ quality: 82, effort: 6 }).toFile(path.join(outDir, `delivery-zones-${lang}.webp`));
  await sharp(png)
    .resize(1200)
    .webp({ quality: 84, effort: 6 })
    .toFile(path.join(outDir, `delivery-zones-${lang}-1200.webp`));
  console.log(`${lang}: written`);
}
await browser.close();
