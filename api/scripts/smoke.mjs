import assert from "node:assert/strict";

// Run against Wrangler's real local runtime or the deployed HTTPS origin.
const base = new URL(process.argv[2] || "http://127.0.0.1:8787");
assert(["http:", "https:"].includes(base.protocol), "Use an HTTP(S) origin");
const origin = base.origin;
let checks = 0;

async function json(path, status = 200, options) {
  const response = await fetch(new URL(path, origin), { ...options, signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, status, `${path}: status`);
  assert.match(response.headers.get("content-type") || "", /application\/json/, `${path}: JSON`);
  assert.equal(response.headers.get("access-control-allow-origin"), "*", `${path}: CORS`);
  checks++;
  return response.json();
}

await json("/health");
const directory = await json("/");
assert.equal(directory.data.documentationUrl, `${origin}/docs`);
assert.equal(directory.data.openapiUrl, `${origin}/openapi.json`);
const docs = await fetch(new URL("/docs", origin), { signal: AbortSignal.timeout(15000) });
assert.equal(docs.status, 200);
assert.match(docs.headers.get("content-type") || "", /text\/html/);
assert.match(await docs.text(), /\/docs-assets\/scalar\.js/);
checks++;
const home = await json("/api/v1/home");
assert.equal(home.data.demoContinueReading.progressPercent, 32);
const categories = await json("/api/v1/categories");
assert.equal(categories.data.length, 4);
const catalog = await json("/api/v1/books");
assert.equal(catalog.data.length, 12);
assert.equal(catalog.meta.pagination.total, 12);
for (const book of catalog.data) {
  assert.equal(new URL(book.coverUrl).origin, origin, "Self-hosted cover URL");
  const detail = await json(`/api/v1/books/${book.id}`);
  assert.equal(detail.data.chapterCount, 3);
  const toc = await json(`/api/v1/books/${book.id}/chapters`);
  assert.equal(toc.data.length, 3);
  for (let index = 0; index < 3; index++) {
    const chapter = await json(`/api/v1/books/${book.id}/chapters/${index}`);
    assert.equal(chapter.data.index, index);
    assert.equal(chapter.data.nextChapterIndex, index < 2 ? index + 1 : null);
    assert.equal(chapter.data.previousChapterIndex, index > 0 ? index - 1 : null);
    assert.equal(chapter.data.paragraphs.length, 4);
  }
  const image = await fetch(book.coverUrl, { signal: AbortSignal.timeout(15000) });
  assert.equal(image.status, 200, book.coverUrl);
  assert.match(image.headers.get("content-type") || "", /image\/png/);
  assert.equal(image.headers.get("access-control-allow-origin"), "*");
  const png = Buffer.from(await image.arrayBuffer());
  assert.equal(png.readUInt32BE(16), 600);
  assert.equal(png.readUInt32BE(20), 855);
  checks++;
}
const query = new URLSearchParams({ q: "اَثَرُ الضَّوْءِ", category: "literature" });
const search = await json(`/api/v1/books?${query}`);
assert.deepEqual(search.data.map(book => book.id), ["light"]);
const empty = await json("/api/v1/books?page=999&limit=3");
assert.deepEqual(empty.data, []);
await json("/api/v1/books?page=0", 400);
await json("/api/v1/books/missing", 404);
await json("/api/v1/books/light/chapters/3", 404);
await json("/images/missing.png", 404);
await json("/missing", 404);
await json("/api/v1/demo-state", 405, { method: "POST" });
const state = await json("/api/v1/demo-state");
assert.deepEqual(state.data.saved, ["light", "slow", "beginnings"]);
const openapi = await json("/openapi.json");
assert.equal(openapi.openapi, "3.1.0");
const head = await fetch(new URL("/api/v1/books", origin), { method: "HEAD", signal: AbortSignal.timeout(15000) });
assert.equal(head.status, 200);
assert.equal(await head.text(), "");
checks++;
const preflight = await fetch(new URL("/api/v1/books", origin), {
  method: "OPTIONS", headers: { Origin: "https://flutter.example", "Access-Control-Request-Method": "GET" },
  signal: AbortSignal.timeout(15000),
});
assert.equal(preflight.status, 204);
assert.equal(preflight.headers.get("access-control-allow-origin"), "*");
checks++;
console.log(`Passed ${checks} runtime checks at ${origin}: catalog, chapters, covers, search, state, errors, CORS, HEAD, OpenAPI, and interactive docs.`);
