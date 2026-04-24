import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const imageApiSource = await readFile(new URL('../api/generate-image.js', import.meta.url), 'utf8');
const providerSource = await readFile(new URL('../api/_shared/provider.js', import.meta.url), 'utf8');
const i18nSource = await readFile(new URL('../src/lib/i18n.ts', import.meta.url), 'utf8');
const storeSource = await readFile(new URL('../src/lib/store.tsx', import.meta.url), 'utf8');
const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
const openaiSource = await readFile(new URL('../src/lib/openai.ts', import.meta.url), 'utf8');

assert.match(imageApiSource, /requestResponses/);
assert.match(imageApiSource, /requestImagesGeneration/);
assert.match(imageApiSource, /requestChatCompletionsImage/);
assert.match(imageApiSource, /X-Lumina-Upstream-Mode/);
assert.match(imageApiSource, /debug:\s*attempts/);
assert.match(imageApiSource, /input_image/);
assert.match(imageApiSource, /\/images\/generations/);
assert.match(imageApiSource, /\/chat\/completions/);

assert.match(openaiSource, /debug\?: string/);
assert.match(openaiSource, /x-lumina-upstream-mode/);

assert.match(providerSource, /imageReferenceHint/);
assert.match(i18nSource, /reference image generation/i);
assert.match(i18nSource, /参考图生成/);
assert.match(storeSource, /MAX_PERSISTED_ASSETS_PER_WORKSPACE/);
assert.match(appSource, /fallbackContext/);

console.log('feature contract ok');
