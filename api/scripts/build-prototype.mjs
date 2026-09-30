import assert from 'node:assert/strict';
import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prototypeDir = path.resolve(apiDir, '../prototype');
const outputDir = path.join(apiDir, 'dist/prototype');
const config = await readFile(path.join(prototypeDir, 'api-config.js'), 'utf8');
const match = config.match(/window\.MAKTABAH_API_BASE\s*=\s*(['"])(.*?)\1\s*;/s);
assert(match, 'Set window.MAKTABAH_API_BASE in prototype/api-config.js before building Pages');
const base = new URL(match[2]);
assert(base.protocol === 'https:' && base.host && !base.username && !base.password &&
  /^\/api\/v1\/?$/.test(base.pathname) && !base.search && !base.hash,
  'The Pages prototype must use a public HTTPS /api/v1 base');
await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
for (const entry of ['index.html', 'app.js', 'styles.css', 'api-config.js', 'assets']) {
  await cp(path.join(prototypeDir, entry), path.join(outputDir, entry), { recursive: true });
}
console.log(`Built Pages assets at ${outputDir}; API: ${base.href}`);
