export interface CategoryRecord {
  id: string;
  name: string;
  icon: string;
}

export interface ChapterRecord {
  index: number;
  title: string;
  paragraphs: string[];
}

export interface BookRecord {
  id: string;
  title: string;
  author: string;
  categoryId: string;
  rating: number;
  pageCount: number;
  language: string;
  description: string;
  tagline: string;
  cover: {
    path: string;
    width: number;
    height: number;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
  };
  chapters: ChapterRecord[];
}

export interface ReadingPosition {
  chapter: number;
  scroll: number;
  updatedAt: number;
}

export interface Bookmark {
  bookId: string;
  chapter: number;
  scroll: number;
}

export interface DemoState {
  saved: string[];
  progress: Record<string, ReadingPosition>;
  bookmarks: Bookmark[];
  preferences: { fontSize: number; theme: "light" | "dark" };
  lastRead: string;
}

export interface CatalogFixture {
  version: number;
  categories: CategoryRecord[];
  books: BookRecord[];
  home: {
    welcomeTitle: string;
    welcomeSubtitle: string;
    hero: { eyebrow: string; title: string; actionLabel: string; bookIds: string[] };
    featuredBookIds: string[];
    quote: { text: string; attribution: string };
  };
  demoState: DemoState;
}

export type Book = Omit<BookRecord, "chapters" | "cover"> & {
  categoryName: string;
  coverUrl: string;
  coverWidth: number;
  coverHeight: number;
  coverBackgroundColor: string;
  chapterCount: number;
  direction: "rtl";
  isFictional: true;
  contentType: "sample";
};
