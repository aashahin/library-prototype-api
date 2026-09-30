import { describe, expect, test } from "bun:test";
import app from "../src/index";
import { fixture, normalizeSearch } from "../src/catalog";
import type { Book, CategoryRecord, ChapterRecord, DemoState, ReadingPosition } from "../src/types";

type Data<T> = { data: T };
type Failure = { error: { code: string; field?: string } };
type BookList = Data<Book[]> & { meta: { pagination: {
  page: number; limit: number; total: number; totalPages: number;
  hasNextPage: boolean; hasPreviousPage: boolean;
} } };
type Home = Data<{ hero: { books: Book[] }; featuredBooks: Book[];
  demoContinueReading: { book: Book; progressPercent: number } }>;

async function get<T = BookList>(path: string, expectedStatus = 200): Promise<T> {
  const response = await app.request(`https://library.example${path}`);
  expect(response.status).toBe(expectedStatus);
  expect(response.headers.get("Content-Type")).toContain("application/json");
  expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  expect(response.headers.get("Content-Language")).toBe("ar");
  expect(response.headers.get("Cache-Control")).toBe(expectedStatus >= 400 ? "no-store" : "public, max-age=300");
  return response.json() as Promise<T>;
}

describe("catalog screens", () => {
  test("catalog has complete Flutter image URLs and stays in prototype order", async () => {
    const { data, meta } = await get("/api/v1/books");
    expect(data.map((book: Book) => book.id)).toEqual(fixture.books.map((book) => book.id));
    expect(meta.pagination).toEqual({ page: 1, limit: 12, total: 12, totalPages: 1,
      hasNextPage: false, hasPreviousPage: false });
    for (const book of data as Book[]) {
      expect(book.coverUrl).toBe(`https://library.example/images/${book.id}.png`);
      expect(book.chapterCount).toBe(3);
      expect(book.contentType).toBe("sample");
      expect(book.isFictional).toBe(true);
      expect(book.language).toBe("ar");
      expect(book.direction).toBe("rtl");
    }
  });

  test("categories count books but exclude the all filter", async () => {
    const { data } = await get<Data<(CategoryRecord & { bookCount: number })[]>>("/api/v1/categories");
    expect(data.map((category: { id: string }) => category.id)).toEqual(
      ["literature", "self-development", "history", "science"],
    );
    expect(data.every((category: { bookCount: number }) => category.bookCount === 3)).toBe(true);
  });

  test("Arabic search removes accents, tatweel, alef variants, and extra spaces", async () => {
    expect(normalizeSearch("  إِلَـى  البَحْر  ")).toBe("الي البحر");
    const { data } = await get(`/api/v1/books?q=${encodeURIComponent("اَثَرُ الضَّوْءِ")}`);
    expect(data.map((book: Book) => book.id)).toEqual(["light"]);
    const author = await get(`/api/v1/books?q=${encodeURIComponent("ادم منصور")}`);
    expect(author.data.map((book: Book) => book.id)).toEqual(["cosmos"]);
    const topic = await get(`/api/v1/books?q=${encodeURIComponent("الأسواق")}`);
    expect(topic.data.map((book: Book) => book.id)).toEqual(["memory", "caravan"]);
  });

  test("category and text search combine, empty results are successful", async () => {
    const matching = await get(`/api/v1/books?category=literature&q=${encodeURIComponent("البحر")}`);
    expect(matching.data.map((book: Book) => book.id)).toEqual(["sea"]);
    const excluded = await get(`/api/v1/books?category=science&q=${encodeURIComponent("البحر")}`);
    expect(excluded.data).toEqual([]);
    expect(excluded.meta.pagination.total).toBe(0);
    expect(excluded.meta.pagination.totalPages).toBe(0);
    expect(excluded.meta.pagination.hasNextPage).toBe(false);
    expect(excluded.meta.pagination.hasPreviousPage).toBe(false);
  });

  test("pagination has no duplicates or omissions, including far-out pages", async () => {
    const allIds: string[] = [];
    for (let page = 1; page <= 4; page++) {
      const { data, meta } = await get(`/api/v1/books?page=${page}&limit=3`);
      allIds.push(...data.map((book: Book) => book.id));
      expect(meta.pagination.totalPages).toBe(4);
      expect(meta.pagination.hasNextPage).toBe(page < 4);
    }
    expect(allIds).toEqual(fixture.books.map((book) => book.id));
    const empty = await get("/api/v1/books?page=9007199254740991&limit=50");
    expect(empty.data).toEqual([]);
    expect(empty.meta.pagination.hasNextPage).toBe(false);
  });

  test("rating order is descending and ties keep catalog order", async () => {
    const { data } = await get("/api/v1/books?sort=rating");
    expect(data.slice(0, 2).map((book: Book) => book.id)).toEqual(["memory", "beginnings"]);
    expect(data.map((book: Book) => book.rating)).toEqual([4.9, 4.9, 4.8, 4.8, 4.8, 4.7, 4.7, 4.6, 4.6, 4.5, 4.5, 4.4]);
  });

  test("home matches hero/featured selections and explicitly labels demo progress", async () => {
    const { data } = await get<Home>("/api/v1/home");
    expect(data.hero.books.map((book: Book) => book.id)).toEqual(["slow", "sea", "light"]);
    expect(data.featuredBooks.map((book: Book) => book.id)).toEqual(["light", "sea", "memory", "slow", "cosmos"]);
    expect(data.demoContinueReading.book.id).toBe("beginnings");
    expect(data.demoContinueReading.progressPercent).toBe(32);
    const history = await get<Home>("/api/v1/home?category=history");
    expect(history.data.featuredBooks.map((book: Book) => book.id)).toEqual(["memory"]);
  });
});

describe("reader and client-local state", () => {
  test("every book has detail/TOC/chapter endpoints with correct navigation boundaries", async () => {
    for (const book of fixture.books) {
      const detail = await get<Data<{ chapters: ChapterRecord[] }>>(`/api/v1/books/${book.id}`);
      const toc = await get<Data<ChapterRecord[]>>(`/api/v1/books/${book.id}/chapters`);
      expect(detail.data.chapters).toEqual(toc.data);
      for (let index = 0; index < book.chapters.length; index++) {
        const { data } = await get<Data<ChapterRecord & { number: number; bookId: string;
          previousChapterIndex: number | null; nextChapterIndex: number | null }>>(`/api/v1/books/${book.id}/chapters/${index}`);
        expect(data.index).toBe(index);
        expect(data.number).toBe(index + 1);
        expect(data.bookId).toBe(book.id);
        expect(data.previousChapterIndex).toBe(index === 0 ? null : index - 1);
        expect(data.nextChapterIndex).toBe(index === 2 ? null : index + 1);
        expect(data.paragraphs).toEqual(book.chapters[index]!.paragraphs);
      }
    }
  });

  test("demo state is a fresh seed response, not shared mutable user state", async () => {
    const first = await get<Data<DemoState>>("/api/v1/demo-state");
    expect(first.data.saved).toEqual(["light", "slow", "beginnings"]);
    expect(first.data.bookmarks).toEqual([]);
    const position: ReadingPosition = first.data.progress.beginnings!;
    expect(position).toEqual({ chapter: 0, scroll: 0.96, updatedAt: 0 });
    first.data.saved.splice(0);
    first.data.progress.beginnings!.scroll = 0;
    const second = await get<Data<DemoState>>("/api/v1/demo-state");
    expect(second.data).toEqual(fixture.demoState);
  });
});

describe("invalid requests", () => {
  test.each([
    "page=0", "page=-1", "page=1.5", "page=1e2", "page=abc", "page=9007199254740992",
    "limit=0", "limit=51", "limit=12abc", "limit=", "category=missing", "category=",
    "sort=popular", "sort=", "page=1&page=2", "limit=3&limit=3", "unknown=1",
    `q=${"x".repeat(201)}`,
  ])("rejects malformed/ambiguous query: %s", async (query) => {
    const result = await get<Failure>(`/api/v1/books?${query}`, 400);
    expect(result.error.code).toBe("INVALID_QUERY");
    expect(typeof result.error.field).toBe("string");
  });

  test("unknown books, chapters, images, and routes have clear errors", async () => {
    expect((await get<Failure>("/api/v1/books/missing", 404)).error.code).toBe("BOOK_NOT_FOUND");
    expect((await get<Failure>("/api/v1/books/missing/chapters/0", 404)).error.code).toBe("BOOK_NOT_FOUND");
    expect((await get<Failure>("/api/v1/books/light/chapters/3", 404)).error.code).toBe("CHAPTER_NOT_FOUND");
    expect((await get<Failure>("/api/v1/books/light/chapters/-1", 400)).error.code).toBe("INVALID_CHAPTER_INDEX");
    expect((await get<Failure>("/api/v1/books/light/chapters/01", 400)).error.code).toBe("INVALID_CHAPTER_INDEX");
    expect((await get<Failure>("/images/missing.png", 404)).error.code).toBe("IMAGE_NOT_FOUND");
    expect((await get<Failure>("/missing", 404)).error.code).toBe("NOT_FOUND");
    await get("/api/v1/home?category=missing", 400);
    await get("/api/v1/categories?q=x", 400);
  });

  test("writes return 405 without changing catalog or demo state", async () => {
    const response = await app.request("https://library.example/api/v1/demo-state", {
      method: "POST", body: JSON.stringify({ saved: [] }),
    });
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET, HEAD, OPTIONS");
    expect((await response.json() as Failure).error.code).toBe("METHOD_NOT_ALLOWED");
    expect((await get<Data<DemoState>>("/api/v1/demo-state")).data).toEqual(fixture.demoState);
  });

  test("Flutter web preflight and HEAD work", async () => {
    const options = await app.request("https://library.example/api/v1/books", {
      method: "OPTIONS", headers: { Origin: "https://flutter.example", "Access-Control-Request-Method": "GET" },
    });
    expect(options.status).toBe(204);
    expect(options.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(options.headers.get("Access-Control-Allow-Methods")).toBe("GET,HEAD,OPTIONS");
    expect(await options.text()).toBe("");
    const head = await app.request("https://library.example/api/v1/books", { method: "HEAD" });
    expect(head.status).toBe(200);
    expect(await head.text()).toBe("");
  });

  test("trailing slashes are accepted without redirects", async () => {
    await get("/api/v1/books/");
    await get("/api/v1/books/light/chapters/0/");
  });
});
