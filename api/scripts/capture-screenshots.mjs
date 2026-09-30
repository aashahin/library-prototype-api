import assert from 'node:assert/strict';
import { mkdir, stat } from 'node:fs/promises';
import { isIP } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

// bun scripts/capture-screenshots.mjs [prototype-url|--local] [worker-origin]
// Each view uses fresh browser storage and actual API responses. --local serves
// the prototype source, while retaining its configured public Worker connection.
const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const prototypeDir = path.join(repoDir, 'prototype');
const outputDir = path.join(repoDir, 'docs/screenshots');
const workerOrigin = new URL(process.argv[3] || 'https://maktabah-demo-api.ashahin.workers.dev').origin;
const workerIp = process.env.MAKTABAH_WORKER_IP;
if (workerIp) assert.equal(isIP(workerIp), 4, 'MAKTABAH_WORKER_IP must be a valid IPv4 address');
let target = process.argv[2] || 'https://maktabah-prototype.pages.dev';
let server;
let browser;
let activePage;
let stage = 'public Worker health';

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  assert.equal(await page.locator('.loading-state, .loading-spinner').count(), 0, 'No loading state in screenshots');
  await page.mouse.move(0, 0);
}

async function save(page, name) {
  await settle(page);
  const filename = path.join(outputDir, name);
  await page.screenshot({ path: filename, fullPage: false, animations: 'disabled' });
  console.log(`${name}: ${(await stat(filename)).size} bytes — ${page.url()}`);
}

async function newPage(viewport, deviceScaleFactor = 1) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor,
    locale: 'ar-EG',
    colorScheme: 'light',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(45_000);
  activePage = page;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  return { context, page, errors };
}

async function loadHome(page) {
  await page.goto(`${target.replace(/\/$/, '')}/#home`, { waitUntil: 'domcontentloaded' });
  assert.equal(await page.evaluate(() => new URL(window.MAKTABAH_API_BASE).origin), workerOrigin,
    'Prototype must use the requested canonical Worker before screenshots are captured');
  await page.waitForFunction(() => document.querySelectorAll('.home-book-grid .book-card').length === 5);
  await page.waitForFunction(() => [...document.querySelectorAll('.book-cover img')]
    .every(image => image.complete && image.naturalWidth > 0));
  assert.equal(await page.locator('.home-book-grid .book-cover.cover-loaded').count(), 5, 'All recommended covers loaded');
  await settle(page);
}

try {
  browser = await chromium.launch({
    executablePath: process.env.COVER_BROWSER_PATH || '/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-quic', ...(workerIp ? [
      // Optional process-local DNS correction; canonical URLs and TLS are kept.
      `--host-resolver-rules=MAP ${new URL(workerOrigin).hostname} ${workerIp}`,
    ] : [])],
  });
  const healthPage = await browser.newPage();
  activePage = healthPage;
  const health = await healthPage.goto(`${workerOrigin}/health`, { timeout: 25_000, waitUntil: 'domcontentloaded' });
  assert(health?.ok(), `Public Worker health returned ${health?.status()}`);
  assert.equal((await health.json()).data.status, 'ok', 'Public Worker is healthy');
  await healthPage.close();
  console.log(`Verified public Worker: ${workerOrigin}`);
  if (target === '--local') {
    server = Bun.serve({
      hostname: '127.0.0.1',
      port: 0,
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
  await mkdir(outputDir, { recursive: true });
  stage = 'desktop home';
  {
    const { context, page, errors } = await newPage({ width: 1440, height: 1050 });
    await loadHome(page);
    await save(page, 'home-desktop.png');
    assert.deepEqual(errors, [], 'Desktop home has no uncaught browser errors');
    await context.close();
  }
  stage = 'mobile home';
  {
    const { context, page, errors } = await newPage({ width: 390, height: 844 }, 2);
    await loadHome(page);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile home has no horizontal overflow');
    await save(page, 'home-mobile.png');
    assert.deepEqual(errors, [], 'Mobile home has no uncaught browser errors');
    await context.close();
  }
  stage = 'Arabic chapter reader';
  {
    const { context, page, errors } = await newPage({ width: 390, height: 844 }, 2);
    await loadHome(page);
    await page.locator('.home-book-grid .cover-button[data-id="light"]').click();
    await page.locator('#book-dialog[open] [data-action="read"]').click();
    await page.waitForFunction(() => document.querySelector('#reader-dialog[open] #reader-article > p')?.textContent.length > 50);
    assert.equal(await page.locator('#reader-article > p').count(), 4, 'Reader shows the four actual sample paragraphs');
    assert.match(await page.locator('#reader-article > p').first().textContent(), /[\u0600-\u06ff]/, 'Arabic reading content');
    await save(page, 'reader.png');
    assert.deepEqual(errors, [], 'Reader has no uncaught browser errors');
    await context.close();
  }
  stage = 'Scalar reference, Dart code, and live Arabic JSON';
  {
    const { context, page, errors } = await newPage({ width: 1440, height: 1050 });
    await page.goto(`${workerOrigin}/docs`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Maktabah Arabic Demo API', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Open Group - Catalog', exact: true }).click();
    await page.getByRole('link', { name: 'Search, filter, sort, and paginate books', exact: false }).click();
    await page.getByRole('button', { name: 'Test Request (get /api/v1/books)', exact: true }).click();
    const [response] = await Promise.all([
      page.waitForResponse(response => new URL(response.url()).pathname === '/api/v1/books'),
      page.getByRole('button', { name: /Send get request to/ }).first().click(),
    ]);
    assert.equal(response.status(), 200, 'Catalog request succeeded');
    assert.equal(new URL(response.url()).origin, workerOrigin, 'Live request uses the canonical Worker');
    const payload = await response.json();
    assert.equal(payload.data[0].title, 'أثر الضوء', 'Actual Arabic JSON response');
    await page.getByRole('button', { name: /^Code Snippet/ }).first().click();
    await page.getByText('Dart Http', { exact: false }).first().waitFor({ state: 'visible' });
    assert.match(await page.locator('body').innerText(), /dart:convert|package:http/, 'Dart source code is visible');
    await save(page, 'api-docs.png');
    assert.deepEqual(errors, [], 'Scalar documentation has no uncaught browser errors');
    await context.close();
  }
  console.log(`Captured four screenshots in ${outputDir}`);
} catch (error) {
  console.error(`Screenshot capture failed during ${stage}`);
  if (activePage && !activePage.isClosed()) {
    await activePage.screenshot({ path: '/tmp/maktabah-screenshot-capture-failure.png', animations: 'disabled' }).catch(() => {});
  }
  throw error;
} finally {
  await browser?.close();
  server?.stop(true);
}
