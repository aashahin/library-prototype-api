import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const origin = new URL(process.argv[2] || 'http://127.0.0.1:8787').origin;
const browser = await chromium.launch({
  executablePath: process.env.COVER_BROWSER_PATH || '/bin/google-chrome',
  headless: true, args: ['--no-sandbox'],
});
let checks = 0;
let stage = 'reference and schema loading';
let page;
try {
  page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const errors = [];
  const frontendRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (['script', 'stylesheet', 'font'].includes(request.resourceType())) frontendRequests.push(request.url());
  });
  const [schemaResponse] = await Promise.all([
    page.waitForResponse(response => new URL(response.url()).pathname === '/openapi.json'),
    page.goto(`${origin}/docs`),
  ]);
  assert.equal(schemaResponse.status(), 200);
  await page.getByRole('heading', { name: 'Maktabah Arabic Demo API', exact: true }).waitFor();
  assert.match(await page.title(), /Maktabah.*API Reference/);
  assert(frontendRequests.some(url => new URL(url).pathname === '/docs-assets/scalar.js'));
  assert(frontendRequests.every(url => new URL(url).origin === origin), 'Self-hosted frontend scripts/fonts');
  assert.match(await page.locator('body').innerText(), /Dart Http/);
  checks++;

  stage = 'real Arabic search request';
  await page.getByRole('button', { name: 'Open Group - Catalog', exact: true }).click();
  await page.getByRole('link', { name: 'Search, filter, sort, and paginate books', exact: false }).click();
  await page.getByRole('button', { name: 'Test Request (get /api/v1/books)', exact: true }).click();
  async function send(path) {
    const [response] = await Promise.all([
      page.waitForResponse(response => new URL(response.url()).pathname === path),
      page.getByRole('button', { name: /Send get request to/ }).first().click(),
    ]);
    assert.equal(new URL(response.url()).origin, origin, 'Request goes directly to this Worker');
    return { response, body: await response.json() };
  }
  const search = await send('/api/v1/books');
  assert.equal(search.response.status(), 200);
  assert.deepEqual(search.body.data.map(book => book.id), ['light']);
  assert.equal(search.body.data[0].title, 'أثر الضوء');
  assert.equal(search.body.meta.filters.q, 'الضوء');
  await page.screenshot({ path: '/tmp/maktabah-api-docs-desktop.png' });
  checks++;

  stage = 'documented validation error';
  await page.locator('[contenteditable][aria-label=" Value"]').filter({ hasText: /^1$/ }).fill('0');
  const invalid = await send('/api/v1/books');
  assert.equal(invalid.response.status(), 400);
  assert.equal(invalid.body.error.code, 'INVALID_QUERY');
  assert.equal(invalid.body.error.field, 'page');
  await page.getByRole('button', { name: 'Close Client', exact: true }).click();
  checks++;

  stage = 'endpoint search and OpenAPI download';
  await page.getByRole('button', { name: /Open Search/ }).click();
  await page.locator('[aria-label="Enter search query"]').fill('chapter');
  await page.getByText('Read one sample chapter', { exact: false }).click();
  const chapterButton = page.getByRole('button', {
    name: 'Test Request (get /api/v1/books/{bookId}/chapters/{index})', exact: true,
  });
  await chapterButton.waitFor();
  await page.goto(`${origin}/docs`);
  await page.getByRole('heading', { name: 'Maktabah Arabic Demo API', exact: true }).waitFor();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download OpenAPI Document as JSON', exact: true }).click(),
  ]);
  const downloadedSpec = await Bun.file(await download.path()).json();
  assert.equal(downloadedSpec.openapi, '3.1.0');
  assert(downloadedSpec.paths['/api/v1/books/{bookId}/chapters/{index}']);
  checks++;

  stage = 'mobile chapter request and layout';
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/docs#tag/reading/GET/api/v1/books/{bookId}/chapters/{index}`);
  await chapterButton.waitFor();
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal page overflow');
  await chapterButton.click();
  const chapter = await send('/api/v1/books/light/chapters/0');
  assert.equal(chapter.response.status(), 200);
  assert.equal(chapter.body.data.index, 0);
  assert.equal(chapter.body.data.previousChapterIndex, null);
  assert.equal(chapter.body.data.paragraphs.length, 4);
  assert(chapter.body.data.paragraphs.every(paragraph => /[\u0600-\u06ff]/.test(paragraph)));
  await page.getByRole('button', { name: 'Close Client', exact: true }).click();
  await page.screenshot({ path: '/tmp/maktabah-api-docs-mobile.png' });
  assert.deepEqual(errors, [], 'No uncaught browser errors');
  checks++;
  console.log(`Passed ${checks} docs browser flows at ${origin}: self-hosted reference, Dart examples, Arabic requests, errors, search, schema download, and mobile chapters.`);
} catch (error) {
  if (page) await page.screenshot({ path: '/tmp/maktabah-api-docs-failure.png' }).catch(() => {});
  console.error(`Docs verification failed during ${stage}.`);
  throw error;
} finally {
  await browser.close();
}
