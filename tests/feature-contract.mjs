import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const imageApiSource = await readFile(new URL('../api/generate-image.js', import.meta.url), 'utf8');
const providerSource = await readFile(new URL('../api/_shared/provider.js', import.meta.url), 'utf8');
const i18nSource = await readFile(new URL('../src/lib/i18n.ts', import.meta.url), 'utf8');
const storeSource = await readFile(new URL('../src/lib/store.tsx', import.meta.url), 'utf8');
const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
const openaiSource = await readFile(new URL('../src/lib/openai.ts', import.meta.url), 'utf8');
const chatInputSource = await readFile(new URL('../src/components/ChatInput.tsx', import.meta.url), 'utf8');
const typesSource = await readFile(new URL('../src/types.ts', import.meta.url), 'utf8');
const settingsModalSource = await readFile(new URL('../src/components/SettingsModal.tsx', import.meta.url), 'utf8');

assert.match(imageApiSource, /requestImagesGeneration/);
assert.match(imageApiSource, /requestImagesEdits/);
assert.match(imageApiSource, /safeFetchJson/);
assert.match(imageApiSource, /multipart\/form-data/);
assert.match(imageApiSource, /formData\.append\('image'/);
assert.match(imageApiSource, /\/images\/generations/);
assert.match(imageApiSource, /\/images\/edits/);
assert.match(imageApiSource, /fallbackContext/);
assert.match(imageApiSource, /debug:\s*attempts/);

assert.match(openaiSource, /debug\?: string/);
assert.match(openaiSource, /payload\.debug/);
assert.match(openaiSource, /imageMode/);
assert.match(providerSource, /imageReferenceHint/);
assert.match(i18nSource, /referenceImageGeneration/);
assert.match(i18nSource, /参考图生成/);
assert.match(storeSource, /MAX_PERSISTED_ASSETS_PER_WORKSPACE/);
assert.match(storeSource, /imageMode: 'auto'/);
assert.match(appSource, /fallbackContext/);
assert.match(appSource, /requestedImageMode/);
assert.match(chatInputSource, /uploadRefImage/);
assert.match(typesSource, /export type ImageModeStrategy = 'auto' \| 'edit' \| 'generate';/);
assert.match(settingsModalSource, /Auto detect/);
assert.match(settingsModalSource, /Force image edit/);

console.log('feature contract ok');
