# Maktabah Arabic demo API

A public, read-only Hono API for the existing Arabic library prototype, running on Cloudflare Workers. The JSON fixture contains 12 fictional books across 4 categories, Arabic descriptions and original reading samples, plus 12 matching PNG covers hosted with the Worker. Each book has three sample chapters. Ratings and full-book page counts are illustrative; no full ebook files are supplied.

Public origin: [maktabah-demo-api.ashahin.workers.dev](https://maktabah-demo-api.ashahin.workers.dev). Flutter API base: `https://maktabah-demo-api.ashahin.workers.dev/api/v1`. Deployed in the **Personal** Cloudflare account. Local origin: `http://127.0.0.1:8787`.

Open the [interactive Scalar API docs](https://maktabah-demo-api.ashahin.workers.dev/docs) to browse endpoints, inspect Arabic response examples, and try requests. The raw OpenAPI document remains available as the [live contract](https://maktabah-demo-api.ashahin.workers.dev/openapi.json) and [`public/openapi.json`](public/openapi.json). During local development, the reference is at `http://127.0.0.1:8787/docs`.

Scalar is served at `/docs` with bundled JavaScript and system fonts. Wrangler's `build.command` runs `bun run docs:prepare` automatically before development and deployment, including direct `bunx wrangler dev` and `bunx wrangler deploy` commands.

Run these commands from `api/`. The package declares Bun >= 1.3 and Node >= 22; project commands use Bun and bunx.

```sh
bun install --frozen-lockfile
bun run types
bun run check
bun run dev
```

`check` runs TypeScript checks, Bun tests, and a Wrangler deployment dry run. `dev` binds to `0.0.0.0:8787`. To deploy to your Cloudflare account:

```sh
bunx wrangler login
bun run deploy
```

With the local Worker running, `bun run smoke` checks all catalog/chapter/image routes through the actual Workers runtime. To check a deployed Worker, use `bun run smoke https://your-worker.your-subdomain.workers.dev`. If port 8787 is occupied, start on another port with `bunx wrangler dev --ip 0.0.0.0 --port 8876 --inspector-port 9255` and check it with `bun run smoke http://127.0.0.1:8876`.

Check the interactive reference in a browser with `bun run docs:test http://127.0.0.1:8787`, or pass the public Worker origin: `bun run docs:test https://maktabah-demo-api.ashahin.workers.dev`.

With multiple Cloudflare accounts, select the intended account using `account_id` in `wrangler.jsonc` or `CLOUDFLARE_ACCOUNT_ID=your_account_id bun run deploy`. Use the HTTPS origin printed after a successful deployment in Flutter. Hono's [Workers guide](https://hono.dev/docs/getting-started/cloudflare-workers) describes this runtime; Cloudflare documents [Wrangler development and deployment](https://developers.cloudflare.com/workers/get-started/guide/) and [its commands](https://developers.cloudflare.com/workers/wrangler/commands/).

All listed API routes accept GET. HEAD and CORS preflight OPTIONS are supported. No API key is needed. CORS permits public reads; there are no public writes, authentication, user accounts, or shared user state.

| GET path | Response data |
| --- | --- |
| `/` | API directory with absolute API, interactive documentation, and raw OpenAPI URLs |
| `/health` | `status: "ok"` and catalog version |
| `/api/v1/home?category=all` | Welcome copy, hero books, quote, categories, featured books, static continue-reading seed |
| `/api/v1/categories` | Category IDs, Arabic names, icon names, and catalog book counts |
| `/api/v1/books` | Book array with pagination and applied filters in `meta` |
| `/api/v1/books/{bookId}` | Book fields, chapter summaries, and sample-content notice |
| `/api/v1/books/{bookId}/chapters` | Chapter summaries with `index`, `number`, and `paragraphCount` |
| `/api/v1/books/{bookId}/chapters/{index}` | One chapter, paragraph array, and previous/next chapter indexes |
| `/api/v1/demo-state` | Optional initial local-state seed |
| `/images/{file}` | Matching PNG cover; use a book's absolute `coverUrl` |
| `/openapi.json` | Raw OpenAPI 3.1 JSON document |

Success responses are `{ "data": ..., "meta": { "apiVersion": "v1", "language": "ar", "direction": "rtl", "isDemo": true } }`. Book-list metadata also includes `pagination` and `filters`; chapter-list metadata also includes `bookId`. Errors use `{ "error": { "code": "...", "message": "...", "field": "..." }, "meta": ... }`; `field` is included for invalid queries. Parse Arabic with UTF-8, render text RTL, and use stable IDs as keys. Successful JSON responses have a five-minute public cache header, covers have a one-day header, and errors use `no-store`.

The catalog accepts these query parameters, once each:

| Parameter | Values and defaults |
| --- | --- |
| `q` | Optional substring search; default empty, at most 200 UTF-16 code units |
| `category` | `all` (default), `literature`, `self-development`, `history`, `science` |
| `sort` | `catalog` (default, fixture order), `title` (Arabic ascending), `rating` (descending; catalog order breaks ties) |
| `page` | Positive decimal safe integer, default `1` |
| `limit` | Integer `1`–`50`, default `12` |

```sh
curl --get 'http://127.0.0.1:8787/api/v1/books' --data-urlencode 'q=البدايات' --data-urlencode 'category=self-development' --data-urlencode 'limit=6'
curl 'http://127.0.0.1:8787/api/v1/books/beginnings/chapters/0'
```

Search covers title, author, description, and category name. It removes Arabic diacritics and tatweel, folds alef variants to `ا` and `ى` to `ي`, trims/collapses whitespace, and lowercases text. The echoed `filters.q` preserves the original query. Empty results and pages beyond `totalPages` return HTTP 200 with `data: []`; no matches means `totalPages: 0`. Unknown, duplicate, and invalid query parameters on every `/api/v1` endpoint return HTTP 400. Pagination rejects leading zeros, signs, decimal/exponent notation, and surrounding whitespace. Other endpoints ignore query parameters. Unknown books/chapters/images return 404, malformed chapter indexes return 400, and unsupported request methods return 405. `/home` accepts only `category`; it filters `featuredBooks` while hero books, category counts, and the static continue-reading seed remain the same.

Chapter indexes are `0`, `1`, `2`; their display numbers are `1`, `2`, `3`. A reading position uses `chapter` as a zero-based index and `scroll` as a fraction from `0` to `1` inside that chapter. Overall progress is `round((chapter + scroll) / chapterCount * 100)`. The seed selects `beginnings` at chapter `0`, scroll `0.96`, hence `32%`; `updatedAt: 0` means no real seed timestamp. Store locally written timestamps as milliseconds since Unix epoch.

Import `/demo-state` once when creating a new per-device local store. Persist an initialization marker even when the user later removes every saved book. Refreshing API content must preserve local saves, progress, bookmarks, theme, font size, and last-read ID. Removing a book from saved removes only its ID from `saved`; preserve its reading progress and bookmarks. Continue-reading should use local state after initialization, rather than repeatedly displaying `/home`'s static demo seed. Match books by ID, clamp a restored chapter to the available chapter range and scroll to `[0, 1]`, and discard invalid references safely. This seed is optional; an app can start with empty state.

The reusable [`examples/maktabah_api.dart`](examples/maktabah_api.dart) client uses `package:http`, safely encodes Arabic queries, checks response envelopes, exposes typed book pagination, and applies a finite timeout. Add it to your Flutter app and install its Dart dependency there:

```sh
flutter pub add http
```

```dart
import 'maktabah_api.dart';

final api = MaktabahApi(origin: 'https://maktabah-demo-api.ashahin.workers.dev');
final page = await api.getBooks(category: 'literature', limit: 6);
final book = page.books.first;
final chapter = await api.getChapter(book.id, 0);
final paragraphs = List<String>.from(chapter.data['paragraphs'] as List);
// Handle ApiException, ApiTransportException, and ApiProtocolException in your UI.
// Close api when its owning service is disposed; do not close it after each request.
```

Flutter widgets can use the returned cover directly, with a fixed aspect ratio and loading/error states:

```dart
AspectRatio(
  aspectRatio: book.coverWidth / book.coverHeight,
  child: Image.network(
    book.coverUrl,
    fit: BoxFit.cover,
    loadingBuilder: (context, child, progress) => progress == null
        ? child
        : const Center(child: CircularProgressIndicator()),
    errorBuilder: (context, error, stackTrace) =>
        const Center(child: Icon(Icons.menu_book)),
  ),
)
```

For a host browser or desktop Flutter app use `http://127.0.0.1:8787`; the Android emulator reaches the host using [`http://10.0.2.2:8787`](https://developer.android.com/studio/run/emulator-networking). A physical phone needs your computer's LAN IP on the same network, plus an accessible port. Use the deployed HTTPS origin in a release app. Android requires [Internet permission](https://docs.flutter.dev/cookbook/networking/fetch-data), and local plain-HTTP testing may require debug-only [Android/iOS network-policy configuration](https://docs.flutter.dev/release/breaking-changes/network-policy-ios-android). The client accepts an origin without `/api/v1`; it adds that path itself.

To edit content, update `data/catalog.json`. To regenerate the local cover assets, run `bun run covers`. Check fixture references, chapter positions, JSON contracts, and Worker behavior with `bun run check` after changes. No database or secret is required for this demo API.

The connected prototype uses the public API base in `../prototype/api-config.js`. Run `bun run prototype:test` to check it in a real browser against that API, or pass the published Pages origin to test the deployed site. This browser check requires Google Chrome (override its executable with `COVER_BROWSER_PATH`).

The [connected Pages prototype](https://maktabah-prototype.pages.dev) has production branch `main` in the Personal account. Redeploy it with `bun run pages:deploy`; it stages only HTML, JavaScript, CSS, fonts, and the favicon, then runs `bunx wrangler pages deploy`. The API is deployed separately with `bunx wrangler deploy` from this directory.
