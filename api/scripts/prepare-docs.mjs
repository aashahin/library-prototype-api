import { copyFile, mkdir } from 'node:fs/promises';

// Ship the Bun-locked standalone bundle with the Worker; no external JS or fonts.
const packageDir = new URL('../node_modules/@scalar/api-reference/', import.meta.url);
const target = new URL('../public/docs-assets/', import.meta.url);
await mkdir(target, { recursive: true });
await copyFile(new URL('dist/browser/standalone.js', packageDir), new URL('scalar.js', target));
await copyFile(new URL('../node_modules/@scalar/hono-api-reference/LICENSE', import.meta.url), new URL('LICENSE.txt', target));
await copyFile(new URL('../../prototype/assets/favicon.svg', import.meta.url), new URL('favicon.svg', target));
console.log('Prepared self-hosted Scalar API reference assets.');
