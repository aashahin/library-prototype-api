import fixtureJson from "../data/catalog.json";
import type { Book, BookRecord, CatalogFixture, ChapterRecord } from "./types";

// The JSON fixture is immutable request input; no public per-user state is stored here.
const theme = fixtureJson.demoState.preferences.theme;
if (theme !== "light" && theme !== "dark") throw new Error("Invalid demo reader theme");
export const fixture: CatalogFixture = {
  ...fixtureJson,
  demoState: {
    ...fixtureJson.demoState,
    preferences: { ...fixtureJson.demoState.preferences, theme },
  },
};

export function findBook(id: string): BookRecord | undefined {
  return fixture.books.find((book) => book.id === id);
}

export function serializeBook(book: BookRecord, origin: string): Book {
  const { cover, chapters, ...fields } = book;
  return {
    ...fields,
    categoryName: fixture.categories.find((category) => category.id === book.categoryId)!.name,
    coverUrl: new URL(cover.path, origin).href,
    coverWidth: cover.width,
    coverHeight: cover.height,
    coverBackgroundColor: cover.backgroundColor,
    chapterCount: chapters.length,
    direction: "rtl",
    isFictional: true,
    contentType: "sample",
  };
}

export function chapterSummary(chapter: ChapterRecord) {
  return {
    index: chapter.index,
    number: chapter.index + 1,
    title: chapter.title,
    paragraphCount: chapter.paragraphs.length,
  };
}

export function categories() {
  return fixture.categories.map((category) => ({
    ...category,
    bookCount: fixture.books.filter((book) => book.categoryId === category.id).length,
  }));
}

export function normalizeSearch(value: string): string {
  return value.normalize("NFKC").trim()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function searchBooks(query: string, category: string, sort: string): BookRecord[] {
  const normalized = normalizeSearch(query);
  const books = fixture.books.filter((book) => {
    if (category !== "all" && book.categoryId !== category) return false;
    const categoryName = fixture.categories.find((item) => item.id === book.categoryId)!.name;
    return !normalized || normalizeSearch(
      `${book.title} ${book.author} ${book.description} ${categoryName}`,
    ).includes(normalized);
  });
  if (sort === "rating") books.sort((a, b) => b.rating - a.rating);
  if (sort === "title") books.sort((a, b) => a.title.localeCompare(b.title, "ar"));
  return books;
}

export function progressPercent(chapter: number, scroll: number, chapterCount: number): number {
  return Math.round((chapter + scroll) / chapterCount * 100);
}
