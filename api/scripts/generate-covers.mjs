import assert from 'node:assert/strict';
import { access, mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { chromium } from 'playwright';

// Read the prototype's original artwork and Arabic copy without changing it.
// Fonts are embedded, so this generator makes no network requests.
const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const prototypeDir = path.join(repoDir, 'prototype');
const outputDir = path.join(repoDir, 'api/public/images');
const [source, stylesheet] = await Promise.all([
  readFile(path.join(prototypeDir, 'app.js'), 'utf8'),
  readFile(path.join(prototypeDir, 'styles.css'), 'utf8'),
]);

function section(text, start, end) {
  const startAt = text.indexOf(start);
  const endAt = text.indexOf(end, startAt + start.length);
  assert(startAt >= 0 && endAt > startAt, `Prototype section missing: ${start}`);
  return text.slice(startAt, endAt);
}

const bookSource = section(source, '  const books = [', '  const byId =');
const rendererSource = section(source, '  function coverArt(book)', '  function percent(id)');
const covers = vm.runInNewContext(
  `${bookSource}\n${rendererSource}\nbooks.map(book => ({ id: book.id, title: book.title, html: cover(book) }));`,
  {},
  { timeout: 1_000 },
);
assert(covers.length > 0, 'No prototype covers found');
assert(new Set(covers.map(cover => cover.id)).size === covers.length, 'Duplicate book IDs');
assert(covers.every(cover => /^[a-z0-9-]+$/.test(cover.id)), 'Unsafe book ID');

const fonts = [
  ['regular', 400],
  ['medium', 500],
  ['bold', 700],
  ['extrabold', 800],
];
const fontStyles = await Promise.all(fonts.map(async ([name, weight]) => {
  const font = await readFile(path.join(prototypeDir, `assets/fonts/tajawal-${name}.ttf`));
  return `@font-face { font-family: Tajawal; src: url(data:font/ttf;base64,${font.toString('base64')}) format('truetype'); font-weight: ${weight}; font-style: normal; font-display: block; }`;
}));
const coverStyles = section(stylesheet, '.book-cover {', '.home-book-grid .cover-title');
const css = `${fontStyles.join('\n')}
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; width: 200px; height: 285px; }
  body { font-family: Tajawal, sans-serif; }
  ${coverStyles}
  .book-cover { width: 200px; height: 285px; border-radius: 0; box-shadow: none; }
`;

const executablePath = process.env.COVER_BROWSER_PATH || '/bin/google-chrome';
await access(executablePath);
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox'],
});
try {
  const context = await browser.newContext({
    viewport: { width: 200, height: 285 },
    deviceScaleFactor: 3,
    locale: 'ar-EG',
    colorScheme: 'light',
  });
  // A remote reference accidentally added to the prototype must fail locally.
  await context.route('**/*', route => route.abort());
  const page = await context.newPage();
  for (const cover of covers) {
    await page.setContent(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>${css}</style></head><body>${cover.html}</body></html>`);
    await page.evaluate(async () => {
      await Promise.all([400, 800].map(weight => document.fonts.load(`${weight} 27px Tajawal`)));
      await document.fonts.ready;
    });
    const layout = await page.evaluate(() => {
      const bounds = document.querySelector('.book-cover').getBoundingClientRect();
      const text = [...document.querySelectorAll('.cover-edition, .cover-title > span, .cover-author')].map(element => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const rect = range.getBoundingClientRect();
        return { content: element.textContent, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      });
      return {
        width: bounds.width,
        height: bounds.height,
        fontLoaded: document.fonts.check('800 27px Tajawal') && document.fonts.check('400 27px Tajawal'),
        text,
      };
    });
    assert.equal(layout.width, 200, `Unexpected width for ${cover.id}`);
    assert.equal(layout.height, 285, `Unexpected height for ${cover.id}`);
    assert(layout.fontLoaded, `Arabic font failed for ${cover.id}`);
    for (const text of layout.text) {
      assert(text.left >= 0 && text.right <= 200 && text.top >= 0 && text.bottom <= 285,
        `Clipped Arabic text on ${cover.id}: ${text.content}`);
    }
    const outputPath = path.join(outputDir, `${cover.id}.png`);
    const png = await page.locator('.book-cover').screenshot({
      path: outputPath,
      type: 'png',
      animations: 'disabled',
      omitBackground: false,
    });
    assert.equal(png.readUInt32BE(16), 600, `Unexpected PNG width for ${cover.id}`);
    assert.equal(png.readUInt32BE(20), 855, `Unexpected PNG height for ${cover.id}`);
    console.log(`${cover.id}.png — ${cover.title} — ${(await stat(outputPath)).size} bytes`);
  }
  await context.close();
  console.log(`Generated ${covers.length} self-hosted 600×855 PNG covers in ${outputDir}`);
} finally {
  await browser.close();
}
