# مكتبة · Maktabah

An Arabic, right-to-left phone prototype for a Flutter library app. The prototype runs on Cloudflare Pages and loads its Arabic books, PNG covers, categories, recommendations, and original chapter text from the public Hono API on Cloudflare Workers.

- Prototype: https://maktabah-prototype.pages.dev
- API base: https://maktabah-demo-api.ashahin.workers.dev/api/v1
- [Interactive API docs](https://maktabah-demo-api.ashahin.workers.dev/docs): Scalar reference with response examples and runnable requests.
- [Raw OpenAPI contract](https://maktabah-demo-api.ashahin.workers.dev/openapi.json).

Both projects are deployed to the Cloudflare Personal account. The API is public and requires no credentials. `api-config.js` sets `window.MAKTABAH_API_BASE` and loads before `app.js`.

## Preview and deploy with Bun

From the repository's `api/` directory:

```sh
bun install --frozen-lockfile
bunx wrangler pages dev ../prototype --port 48763
```

Visit http://localhost:48763. The preview uses the configured public Worker. To use a local API, run `bun run dev` in a separate terminal and set `window.MAKTABAH_API_BASE` in `prototype/api-config.js` to `http://localhost:8787/api/v1`, then reload the preview. Restore the public HTTPS base before deployment; the Pages build validates it.

```sh
bun run prototype:test
bun run pages:deploy
```

The prototype needs an internet connection for its API and covers. Opening `index.html` directly also uses the configured public API; it is not an offline catalog. Connection failures show an Arabic retry action. Fonts and icons are bundled locally.

## Explore

- **الرئيسية:** recommendations and a shortcut to your last reading position.
- **استكشف:** server search by title, author, or topic combined with category filters. The app loads every result page and cancels stale searches.
- **مكتبتي:** saved books and reading progress, with separate filters.
- **علامات القراءة:** return to a bookmarked chapter and position.
- **Reader:** original API paragraphs, actual chapter titles and chapter count, chapter navigation, adjustable text size, and day/night themes.

Saved books, progress, bookmarks, and reader preferences live in browser `localStorage` on this device; the read-only API does not receive them. A new browser storage record receives the API's demo state once. An intentionally empty library stays empty after reload. Removing a saved book preserves reading progress. Invalid old book IDs and chapter positions are reconciled against the loaded API catalog. If browser storage is unavailable, changes last for the current session.

Desktop browsers show an interactive phone frame; mobile browsers show the app edge to edge. Use `/` to focus search, Tab to navigate controls, Escape to dismiss a dialog, and the bottom navigation to switch screens.

## Files

- `index.html`: app shell, configuration script, and dialogs.
- `api-config.js`: public API base URL.
- `styles.css`: phone layout, cover loading states, and reader themes.
- `app.js`: API loading, server search, reader requests, navigation, and local state. The original catalog and SVG artwork remain solely as source material for `api/scripts/generate-covers.mjs`.
- `assets/fonts/`: Tajawal fonts and their SIL Open Font License.

All books and authors are fictional; ratings and total page counts are illustrative. Each book currently contains three original sample chapters, not a full ebook. This prototype includes no authentication or Flutter source; the reusable Dart API client is in `api/examples/maktabah_api.dart`.
