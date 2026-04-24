import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const imageApiSource = await readFile(new URL('../api/generate-image.js', import.meta.url), 'utf8');
const providerSource = await readFile(new URL('../api/_shared/provider.js', import.meta.url), 'utf8');
const i18nSource = await readFile(new URL('../src/lib/i18n.ts', import.meta.url), 'utf8');
const storeSource = await readFile(new URL('../src/lib/store.tsx', import.meta.url), 'utf8');
const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');

assert.match(imageApiSource, /shouldFallbackToText/);
assert.match(imageApiSource, /type:\s*'input_image'/);
assert.match(imageApiSource, /fallbackContext/);
assert.match(imageApiSource, /shouldFallbackToText\(response, data\)/);

assert.match(providerSource, /imageReferenceEnabled:\s*true/);
assert.match(providerSource, /imageReferenceHint/);

assert.match(i18nSource, /reference image generation/i);
assert.match(i18nSource, /参考图生成/);

assert.match(storeSource, /sanitizePersistedSettings/);
assert.match(storeSource, /migratePersistedState/);
assert.match(storeSource, /state\.workspaces\.length <= 1/);
assert.match(storeSource, /Object\.fromEntries/);
assert.match(storeSource, /apiKey:\s*''/);

assert.match(appSource, /Delete current workspace/);
assert.match(appSource, /referenceAssets/);
assert.match(appSource, /fallbackContext/);

console.log('feature contract ok');
