import { Hono } from "hono";
import { cors } from "hono/cors";
import { apiReference } from "./docs";
import { categories, chapterSummary, findBook, fixture, progressPercent, searchBooks, serializeBook } from "./catalog";
import { booksQuery, categoryParam, QueryError, validateQuery } from "./validation";

const app = new Hono<{ Bindings: CloudflareBindings }>({ strict: false });
const meta = { apiVersion: "v1", language: "ar", direction: "rtl", isDemo: true } as const;

app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "HEAD", "OPTIONS"],
  allowHeaders: ["Content-Type", "If-None-Match"],
  exposeHeaders: ["Content-Type", "Cache-Control", "ETag"],
  maxAge: 86400,
}));

app.use("*", async (c, next) => {
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Content-Language", "ar");
  await next();
  c.header("Cache-Control", c.res.status >= 400 ? "no-store" :
    c.req.path.startsWith("/images/") ? "public, max-age=86400" : "public, max-age=300");
});

app.get("/", (c) => {
  const origin = new URL(c.req.url).origin;
  return c.json({
    data: {
      name: "مكتبة — واجهة تجريبية عامة",
      description: "كتب ومؤلفون تخيليون ونصوص عربية أصلية لتجربة تطبيق المكتبة.",
      baseUrl: `${origin}/api/v1`,
      documentationUrl: `${origin}/docs`,
      openapiUrl: `${origin}/openapi.json`,
      endpoints: ["/health", "/api/v1/home", "/api/v1/categories", "/api/v1/books",
        "/api/v1/books/{bookId}", "/api/v1/books/{bookId}/chapters",
        "/api/v1/books/{bookId}/chapters/{index}", "/api/v1/demo-state"],
      stateStorage: "client",
    },
    meta,
  });
});

app.get("/health", (c) => c.json({ data: { status: "ok", catalogVersion: fixture.version }, meta }));

app.get("/api/v1/categories", (c) => {
  validateQuery(new URL(c.req.url), []);
  return c.json({ data: categories(), meta });
});

app.get("/api/v1/books", (c) => {
  const url = new URL(c.req.url);
  const { q, category, page, limit, sort } = booksQuery(url);
  const matches = searchBooks(q, category, sort);
  const total = matches.length;
  const totalPages = Math.ceil(total / limit);
  // Skip offset arithmetic on out-of-range pages (including very large safe integers).
  const selected = page > totalPages ? [] : matches.slice((page - 1) * limit, page * limit);
  return c.json({
    data: selected.map((book) => serializeBook(book, url.origin)),
    meta: {
      ...meta,
      pagination: { page, limit, total, totalPages, hasNextPage: page < totalPages,
        hasPreviousPage: page > 1 && totalPages > 0 },
      filters: { q, category, sort },
    },
  });
});

app.get("/api/v1/books/:bookId", (c) => {
  validateQuery(new URL(c.req.url), []);
  const book = findBook(c.req.param("bookId"));
  if (!book) return c.json({ error: { code: "BOOK_NOT_FOUND", message: "الكتاب غير موجود." }, meta }, 404);
  return c.json({ data: {
    ...serializeBook(book, new URL(c.req.url).origin),
    chapters: book.chapters.map(chapterSummary),
    notice: "كتاب ومؤلف تخيليان؛ الصفحات والتقييم توضيحيان، والمتاح للقراءة مقتطف من ثلاثة فصول.",
  }, meta });
});

app.get("/api/v1/books/:bookId/chapters", (c) => {
  validateQuery(new URL(c.req.url), []);
  const book = findBook(c.req.param("bookId"));
  if (!book) return c.json({ error: { code: "BOOK_NOT_FOUND", message: "الكتاب غير موجود." }, meta }, 404);
  return c.json({ data: book.chapters.map(chapterSummary), meta: { ...meta, bookId: book.id } });
});

app.get("/api/v1/books/:bookId/chapters/:index", (c) => {
  validateQuery(new URL(c.req.url), []);
  const book = findBook(c.req.param("bookId"));
  if (!book) return c.json({ error: { code: "BOOK_NOT_FOUND", message: "الكتاب غير موجود." }, meta }, 404);
  const raw = c.req.param("index");
  if (!/^(0|[1-9]\d*)$/.test(raw) || !Number.isSafeInteger(Number(raw))) {
    return c.json({ error: { code: "INVALID_CHAPTER_INDEX", message: "معرّف الفصل عدد صحيح يبدأ من الصفر." }, meta }, 400);
  }
  const index = Number(raw);
  const chapter = book.chapters[index];
  if (!chapter) return c.json({ error: { code: "CHAPTER_NOT_FOUND", message: "الفصل غير موجود." }, meta }, 404);
  return c.json({ data: {
    ...chapter,
    bookId: book.id,
    number: index + 1,
    chapterCount: book.chapters.length,
    previousChapterIndex: index > 0 ? index - 1 : null,
    nextChapterIndex: index + 1 < book.chapters.length ? index + 1 : null,
  }, meta });
});

app.get("/api/v1/home", (c) => {
  const url = new URL(c.req.url);
  validateQuery(url, ["category"]);
  const category = categoryParam(url);
  const { hero, featuredBookIds, ...home } = fixture.home;
  const featured = featuredBookIds.map((id) => findBook(id)!)
    .filter((book) => category === "all" || book.categoryId === category);
  const demoBook = findBook(fixture.demoState.lastRead)!;
  const demoPosition = fixture.demoState.progress[demoBook.id]!;
  return c.json({ data: {
    ...home,
    hero: { eyebrow: hero.eyebrow, title: hero.title, actionLabel: hero.actionLabel,
      books: hero.bookIds.map((id) => serializeBook(findBook(id)!, url.origin)) },
    categories: categories(),
    featuredBooks: featured.map((book) => serializeBook(book, url.origin)),
    demoContinueReading: {
      book: serializeBook(demoBook, url.origin),
      position: demoPosition,
      progressPercent: progressPercent(demoPosition.chapter, demoPosition.scroll, demoBook.chapters.length),
    },
  }, meta });
});

app.get("/api/v1/demo-state", (c) => {
  validateQuery(new URL(c.req.url), []);
  return c.json({ data: fixture.demoState, meta });
});

app.get("/images/:file", async (c) => {
  const file = c.req.param("file");
  if (!fixture.books.some((book) => book.cover.path === `/images/${file}`)) {
    return c.json({ error: { code: "IMAGE_NOT_FOUND", message: "الصورة غير موجودة." }, meta }, 404);
  }
  const response = await c.env.ASSETS.fetch(c.req.raw);
  if (response.status === 404) {
    return c.json({ error: { code: "IMAGE_NOT_FOUND", message: "الصورة غير موجودة." }, meta }, 404);
  }
  return response;
});

app.get("/openapi.json", async (c) => {
  const response = await c.env.ASSETS.fetch(c.req.raw);
  return response;
});

app.get("/docs", apiReference);

app.get("/docs-assets/:file", async (c) => {
  if (!["scalar.js", "favicon.svg", "LICENSE.txt"].includes(c.req.param("file"))) {
    return c.json({ error: { code: "NOT_FOUND", message: "المسار غير موجود." }, meta }, 404);
  }
  return c.env.ASSETS.fetch(c.req.raw);
});

app.all("*", (c) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
    c.header("Allow", "GET, HEAD, OPTIONS");
    return c.json({ error: { code: "METHOD_NOT_ALLOWED", message: "هذه واجهة للقراءة فقط؛ استخدم GET." }, meta }, 405);
  }
  return c.json({ error: { code: "NOT_FOUND", message: "المسار غير موجود." }, meta }, 404);
});

app.onError((error, c) => {
  if (error instanceof QueryError) {
    return c.json({ error: { code: "INVALID_QUERY", message: error.message, field: error.field }, meta }, 400);
  }
  console.error(JSON.stringify({ event: "request_failed", path: c.req.path, message: error.message }));
  return c.json({ error: { code: "INTERNAL_ERROR", message: "تعذّر إكمال الطلب." }, meta }, 500);
});

export default app;
