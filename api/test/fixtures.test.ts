import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { fixture, progressPercent } from "../src/catalog";

test("all fixture relationships and PNG assets are valid", async () => {
  const bookIds = fixture.books.map((book) => book.id);
  expect(fixture.books).toHaveLength(12);
  expect(new Set(bookIds).size).toBe(12);
  expect(new Set(fixture.categories.map((category) => category.id)).size).toBe(4);
  const paragraphs: string[] = [];
  for (const book of fixture.books) {
    expect(fixture.categories.some((category) => category.id === book.categoryId)).toBe(true);
    expect(book.rating).toBeGreaterThanOrEqual(0);
    expect(book.rating).toBeLessThanOrEqual(5);
    expect(Number.isInteger(book.pageCount)).toBe(true);
    expect(book.pageCount).toBeGreaterThan(0);
    expect(book.chapters.map((chapter) => chapter.index)).toEqual([0, 1, 2]);
    expect(book.cover.path).toBe(`/images/${book.id}.png`);
    for (const chapter of book.chapters) {
      expect(chapter.paragraphs).toHaveLength(4);
      expect(chapter.paragraphs.every((text) => /[\u0600-\u06ff]/u.test(text) && text.trim().length > 50)).toBe(true);
      paragraphs.push(...chapter.paragraphs);
    }
    const png = await readFile(new URL(`../public${book.cover.path}`, import.meta.url));
    expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(png.readUInt32BE(16)).toBe(book.cover.width);
    expect(png.readUInt32BE(20)).toBe(book.cover.height);
  }
  expect(new Set(paragraphs).size).toBe(144);
  for (const id of [...fixture.home.hero.bookIds, ...fixture.home.featuredBookIds,
    ...fixture.demoState.saved, fixture.demoState.lastRead]) expect(bookIds).toContain(id);
  for (const [id, position] of Object.entries(fixture.demoState.progress)) {
    expect(bookIds).toContain(id);
    expect(position.chapter).toBeGreaterThanOrEqual(0);
    expect(position.chapter).toBeLessThan(3);
    expect(position.scroll).toBeGreaterThanOrEqual(0);
    expect(position.scroll).toBeLessThanOrEqual(1);
  }
  expect(progressPercent(0, 0.96, 3)).toBe(32);
  expect(progressPercent(0, 0, 3)).toBe(0);
  expect(progressPercent(2, 1, 3)).toBe(100);
});
