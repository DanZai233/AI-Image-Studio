import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const imageApiSource = await readFile(new URL('../api/generate-image.js', import.meta.url), 'utf8');
const providerSource = await readFile(new URL('../api/_shared/provider.js', import.meta.url), 'utf8');
const i18nSource = await readFile(new URL('../src/lib/i18n.ts', import.meta.url), 'utf8');
const storeSource = await readFile(new URL('../src/lib/store.tsx', import.meta.url), 'utf8');
const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');

assert.match(imageApiSource, /provider\.endpoint\}\/responses/);
assert.doesNotMatch(imageApiSource, /\/images\/generations/);
assert.match(imageApiSource, /input_image/);
assert.match(imageApiSource, /output_text/);
assert.match(imageApiSource, /image_generation_call/);

assert.match(providerSource, /imageReferenceHint/);
assert.match(i18nSource, /reference image generation/i);
assert.match(i18nSource, /参考图生成/);

assert.match(storeSource, /MAX_PERSISTED_ASSETS_PER_WORKSPACE/);
assert.match(storeSource, /MAX_PERSISTED_DATA_URL_LENGTH/);
assert.match(storeSource, /createPersistableAssets/);
assert.match(storeSource, /createPersistableMessages/);
assert.match(storeSource, /apiKey:\s*''/);

assert.match(appSource, /fallbackContext/);
assert.match(appSource, /referenceAssets/);

console.log('feature contract ok');
