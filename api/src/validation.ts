import { fixture } from "./catalog";

export class QueryError extends Error {
  constructor(public readonly field: string, message: string) {
    super(message);
  }
}

export function validateQuery(url: URL, allowed: readonly string[]): void {
  for (const key of url.searchParams.keys()) {
    if (!allowed.includes(key)) throw new QueryError(key, "معامل بحث غير مدعوم.");
    if (url.searchParams.getAll(key).length !== 1) {
      throw new QueryError(key, "يجب إرسال كل معامل مرة واحدة فقط.");
    }
  }
}

export function categoryParam(url: URL): string {
  const value = url.searchParams.get("category") ?? "all";
  if (value !== "all" && !fixture.categories.some((category) => category.id === value)) {
    throw new QueryError("category", "التصنيف غير موجود. استخدم معرّف تصنيف صالحًا أو all.");
  }
  return value;
}

export function integerParam(url: URL, key: string, defaultValue: number, max: number): number {
  const raw = url.searchParams.get(key);
  if (raw === null) return defaultValue;
  if (!/^[1-9]\d*$/.test(raw) || !Number.isSafeInteger(Number(raw)) || Number(raw) > max) {
    throw new QueryError(key, `يجب أن تكون قيمة ${key} عددًا صحيحًا بين 1 و${max}.`);
  }
  return Number(raw);
}

export function booksQuery(url: URL) {
  validateQuery(url, ["q", "category", "page", "limit", "sort"]);
  const q = url.searchParams.get("q") ?? "";
  if (q.length > 200) throw new QueryError("q", "يجب ألا يتجاوز البحث 200 حرف.");
  const sort = url.searchParams.get("sort") ?? "catalog";
  if (!["catalog", "title", "rating"].includes(sort)) {
    throw new QueryError("sort", "الترتيب المتاح: catalog أو title أو rating.");
  }
  return {
    q,
    category: categoryParam(url),
    page: integerParam(url, "page", 1, Number.MAX_SAFE_INTEGER),
    limit: integerParam(url, "limit", 12, 50),
    sort,
  };
}
