import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import fixture from '../data/catalog.json' with { type: 'json' };

// Run with Bun. An optional URL tests the published Pages site; otherwise serve
// the source locally and exercise it against its configured public Worker.
const prototypeDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../prototype');
let server;
let target = process.argv[2];
if (!target) {
  server = Bun.serve({
    hostname: '127.0.0.1', port: 0,
    async fetch(request) {
      const url = new URL(request.url);
      const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
      const filename = path.resolve(prototypeDir, `.${relative}`);
      if (!filename.startsWith(`${prototypeDir}/`)) return new Response('Not found', { status: 404 });
      const file = Bun.file(filename);
      return await file.exists() ? new Response(file) : new Response('Not found', { status: 404 });
    },
  });
  target = `http://127.0.0.1:${server.port}`;
}
const browser = await chromium.launch({
  executablePath: process.env.COVER_BROWSER_PATH || '/bin/google-chrome',
  headless: true, args: ['--no-sandbox'],
});
let checks = 0;
let activePage;
let stage = 'home/API bootstrap';
try {
  const context = await browser.newContext({ viewport: { width: 430, height: 900 }, locale: 'ar-EG' });
  const page = await context.newPage();
  activePage = page;
  const errors = [];
  const requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().includes('/api/v1/')) requests.push(new URL(request.url())); });
  await page.goto(target);
  await page.waitForFunction(() => document.querySelectorAll('.home-book-grid .book-card').length === 5);
  const apiBase = await page.evaluate(() => window.MAKTABAH_API_BASE);
  assert(new URL(apiBase).protocol === 'https:', 'Public HTTPS API configured');
  assert(requests.some(url => url.pathname === '/api/v1/books'), 'Catalog was fetched from API');
  assert(requests.some(url => url.pathname === '/api/v1/home'), 'Home was fetched from API');
  assert(requests.some(url => url.pathname === '/api/v1/categories'), 'Categories were fetched from API');
  await page.waitForFunction(() => [...document.querySelectorAll('.home-book-grid .book-cover img')]
    .every(image => image.complete && image.naturalWidth > 0));
  assert.equal(await page.locator('.home-book-grid .book-cover img').count(), 5, 'API images rendered');
  checks++;

  stage = 'search and immediate category changes';
  console.log('Verified home/API bootstrap and PNG covers.');
  await page.locator('[data-route="discover"]').click();
  await page.waitForFunction(() => document.querySelectorAll('#main .book-card').length === 12);
  await page.locator('#global-search').fill('الضوء');
  await page.waitForFunction(() => {
    const cards = document.querySelectorAll('#main .book-card');
    return cards.length === 1 && cards[0].dataset.bookId === 'light';
  });
  assert(requests.some(url => url.searchParams.get('q') === 'الضوء'), 'Search uses API');
  await page.locator('#main .category-chip').filter({ hasText: 'علوم ومعرفة' }).click();
  await page.waitForFunction(() => document.querySelectorAll('#main .book-card').length === 0 &&
    document.querySelector('#main').textContent.includes('لم نجد'));
  assert(requests.some(url => url.searchParams.get('q') === 'الضوء' && url.searchParams.get('category') === 'science'), 'Combined search/category');
  await page.locator('#main [data-action="reset-filters"]').click();
  await page.waitForFunction(() => document.querySelectorAll('#main .book-card').length === 12);
  const immediateCategoryRequest = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.pathname === '/api/v1/books' && url.searchParams.get('category') === 'literature';
  });
  await page.evaluate(() => {
    const input = document.querySelector('#global-search');
    input.value = 'البحر';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#main [data-action="category"][data-category="literature"]').click();
  });
  assert.equal(new URL((await immediateCategoryRequest).url()).searchParams.get('q'), 'البحر',
    'Immediate category click uses the current input, without a stale search query');
  await page.waitForFunction(() => {
    const cards = document.querySelectorAll('#main .book-card');
    return cards.length === 1 && cards[0].dataset.bookId === 'sea';
  });
  await page.locator('#main .clear-search').click();
  await page.waitForFunction(() => document.querySelectorAll('#main .book-card').length === 3);
  await page.locator('#main [data-action="category"][data-category="all"]').click();
  await page.waitForFunction(() => document.querySelectorAll('#main .book-card').length === 12);
  checks++;

  stage = 'reader chapter content/navigation';
  console.log('Verified search and immediate category changes.');
  await page.locator('#main .cover-button[data-id="light"]').click();
  await page.locator('#book-dialog[open] [data-action="read"]').click();
  await page.waitForFunction(expected => document.querySelector('#reader-dialog[open] #reader-article > p')?.textContent === expected,
    fixture.books.find(book => book.id === 'light').chapters[0].paragraphs[0]);
  assert.deepEqual(await page.locator('#reader-article p').allTextContents(), fixture.books.find(book => book.id === 'light').chapters[0].paragraphs);
  assert(requests.some(url => url.pathname === '/api/v1/books/light/chapters/0'), 'Reader fetches API content');
  assert(await page.locator('#previous-chapter').isDisabled(), 'First chapter boundary');
  await page.locator('#next-chapter').click();
  await page.waitForFunction(expected => document.querySelector('#chapter-select').value === '1' &&
    document.querySelector('#reader-article p')?.textContent === expected,
    fixture.books.find(book => book.id === 'light').chapters[1].paragraphs[0]);
  assert.deepEqual(await page.locator('#reader-article p').allTextContents(), fixture.books.find(book => book.id === 'light').chapters[1].paragraphs);
  await page.locator('#reader-bookmark').click();
  await page.locator('#next-chapter').click();
  await page.waitForFunction(expected => document.querySelector('#chapter-select').value === '2' &&
    document.querySelector('#next-chapter').disabled && document.querySelector('#reader-article p')?.textContent === expected,
    fixture.books.find(book => book.id === 'light').chapters[2].paragraphs[0]);
  assert.deepEqual(await page.locator('#reader-article p').allTextContents(), fixture.books.find(book => book.id === 'light').chapters[2].paragraphs);
  await page.locator('#reader-theme').click();
  await page.locator('[data-action="font-larger"]').click();
  await page.locator('[data-action="close-reader"]').click();
  await page.locator('#book-dialog .detail-save').click();
  await page.locator('[data-action="close-details"]').click();
  let state = await page.evaluate(() => JSON.parse(localStorage.getItem('maktabah.prototype.v1')));
  assert(!state.saved.includes('light'), 'Unsave works');
  assert(state.progress.light, 'Unsave preserves reading progress');
  assert(state.bookmarks.some(mark => mark.bookId === 'light' && mark.chapter === 1), 'Bookmark persisted');
  assert.equal(state.preferences.theme, 'dark', 'Theme persisted');
  assert.equal(state.preferences.fontSize, 23, 'Font size persisted');
  checks++;

  stage = 'bookmark reopen and persistence';
  console.log('Verified reader chapters, save/progress separation, and preferences.');
  await page.locator('[data-route="bookmarks"]').click();
  await page.locator('[data-action="open-bookmark"][data-id="light"]').click();
  await page.waitForFunction(expected => document.querySelector('#reader-dialog[open] #chapter-select')?.value === '1' &&
    document.querySelector('#reader-article p')?.textContent === expected,
    fixture.books.find(book => book.id === 'light').chapters[1].paragraphs[0]);
  assert.deepEqual(await page.locator('#reader-article p').allTextContents(), fixture.books.find(book => book.id === 'light').chapters[1].paragraphs);
  await page.locator('[data-action="close-reader"]').click();
  await page.reload();
  await page.waitForFunction(() => document.querySelector('[data-action="open-bookmark"][data-id="light"]'));
  state = await page.evaluate(() => JSON.parse(localStorage.getItem('maktabah.prototype.v1')));
  assert(!state.saved.includes('light') && state.progress.light && state.bookmarks.length === 1, 'Reload keeps local state');
  assert.equal(state.preferences.theme, 'dark');
  assert.equal(errors.length, 0, `Uncaught browser errors: ${errors.join('; ')}`);
  checks++;

  stage = 'intentional empty-library persistence';
  console.log('Verified bookmark reopening and persistence.');
  // Existing empty state must remain empty after content refreshes/reloads.
  const emptyContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await emptyContext.addInitScript(() => {
    if (!localStorage.getItem('maktabah.prototype.v1')) localStorage.setItem('maktabah.prototype.v1', JSON.stringify({
      saved: [], progress: {}, bookmarks: [], preferences: { fontSize: 21, theme: 'light' }, lastRead: 'beginnings',
    }));
  });
  const emptyPage = await emptyContext.newPage();
  activePage = emptyPage;
  await emptyPage.goto(`${target}/#library`);
  await emptyPage.waitForFunction(() => document.querySelector('#main').textContent.includes('رفّك ينتظر'));
  assert.equal(await emptyPage.locator('#main .book-card').count(), 0);
  await emptyPage.reload();
  await emptyPage.waitForFunction(() => document.querySelector('#main').textContent.includes('رفّك ينتظر'));
  assert.equal(await emptyPage.locator('#main .book-card').count(), 0);
  checks++;
  await emptyContext.close();

  stage = 'bootstrap failure/retry';
  console.log('Verified intentional empty-library persistence.');
  // API failures must show a retry, rather than a silently substituted catalog.
  const failureContext = await browser.newContext({ viewport: { width: 430, height: 900 } });
  const failurePage = await failureContext.newPage();
  activePage = failurePage;
  const failureErrors = [];
  failurePage.on('pageerror', error => failureErrors.push(error.message));
  let failBootstrap = true;
  let failSearch = false;
  let failToc = false;
  let failChapter = false;
  await failureContext.route(`${apiBase}/**`, async route => {
    const url = new URL(route.request().url());
    const failed = (url.pathname === '/api/v1/books' && (failBootstrap || (failSearch && !!url.searchParams.get('q')))) ||
      (failToc && url.pathname === '/api/v1/books/light/chapters') ||
      (failChapter && url.pathname === '/api/v1/books/light/chapters/0');
    if (failed) await route.fulfill({ status: 503, contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: { code: 'TEMPORARY_FAILURE', message: 'تعذّر الاتصال مؤقتًا.' },
        meta: { apiVersion: 'v1', language: 'ar', direction: 'rtl', isDemo: true } }),
    });
    else await route.continue();
  });
  await failurePage.goto(target);
  await failurePage.locator('[data-action="retry-bootstrap"]').waitFor();
  assert.equal(await failurePage.locator('#main .book-card').count(), 0, 'No hardcoded online fallback');
  failBootstrap = false;
  await failurePage.locator('[data-action="retry-bootstrap"]').click();
  await failurePage.waitForFunction(() => document.querySelectorAll('.home-book-grid .book-card').length === 5);
  checks++;
  stage = 'search failure/retry';
  await failurePage.locator('[data-route="discover"]').click();
  await failurePage.waitForFunction(() => document.querySelectorAll('#main .book-card').length === 12);
  failSearch = true;
  await failurePage.locator('#global-search').fill('الضوء');
  await failurePage.locator('[data-action="retry-search"]').waitFor();
  failSearch = false;
  await failurePage.locator('[data-action="retry-search"]').click();
  await failurePage.waitForFunction(() => document.querySelectorAll('#main .book-card').length === 1 &&
    document.querySelector('#main .book-card').dataset.bookId === 'light');
  checks++;
  stage = 'reader/chapter failure/retry';
  failToc = true;
  await failurePage.locator('#main .cover-button[data-id="light"]').click();
  await failurePage.locator('#book-dialog[open] [data-action="read"]').click();
  await failurePage.locator('[data-action="retry-reader"]').waitFor();
  assert(!(await failurePage.evaluate(() => JSON.parse(localStorage.getItem('maktabah.prototype.v1')).progress.light)),
    'Failed reader does not invent progress');
  failToc = false;
  failChapter = true;
  await failurePage.locator('[data-action="retry-reader"]').click();
  await failurePage.locator('[data-action="retry-chapter"]').waitFor();
  assert(!(await failurePage.evaluate(() => JSON.parse(localStorage.getItem('maktabah.prototype.v1')).progress.light)),
    'Failed chapter does not invent progress');
  failChapter = false;
  await failurePage.locator('[data-action="retry-chapter"]').click();
  await failurePage.waitForFunction(expected => document.querySelector('#reader-article > p')?.textContent === expected,
    fixture.books.find(book => book.id === 'light').chapters[0].paragraphs[0]);
  assert.equal(failureErrors.length, 0, `Uncaught failure/retry errors: ${failureErrors.join('; ')}`);
  checks++;
  await failureContext.close();

  activePage = page;
  stage = 'final screenshot';
  await page.goto(`${target}/#home`);
  await page.waitForFunction(() => document.querySelectorAll('.home-book-grid .book-card').length === 5);
  await page.screenshot({ path: '/tmp/maktabah-connected-prototype.png', fullPage: true });
  await context.close();
  console.log(`Passed ${checks} connected browser flows at ${target}: live API data/images, search/filter races, reader, navigation, bookmarks, preferences, persistence, empty libraries, and bootstrap/search/reader retries.`);
} catch (error) {
  console.error(`Prototype browser check failed during: ${stage}`);
  if (activePage && !activePage.isClosed()) {
    await activePage.screenshot({ path: '/tmp/maktabah-prototype-failure.png', fullPage: true }).catch(() => {});
    console.error((await activePage.locator('body').innerText()).slice(-2400));
  }
  throw error;
} finally {
  await browser.close();
  server?.stop(true);
}
