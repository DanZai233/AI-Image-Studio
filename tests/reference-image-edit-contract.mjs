import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const imageApiSource = await readFile(new URL('../api/generate-image.js', import.meta.url), 'utf8');
const typesSource = await readFile(new URL('../src/types.ts', import.meta.url), 'utf8');
const openaiSource = await readFile(new URL('../src/lib/openai.ts', import.meta.url), 'utf8');
const settingsSource = await readFile(new URL('../src/components/SettingsModal.tsx', import.meta.url), 'utf8');
const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');

assert.match(typesSource, /export type ImageModeStrategy = 'auto' \| 'edit' \| 'generate';/);
assert.match(typesSource, /imageMode: ImageModeStrategy;/);
assert.match(openaiSource, /imageMode = settings\.imageMode/);
assert.match(openaiSource, /imageMode,/);
assert.match(appSource, /requestedImageMode/);
assert.match(imageApiSource, /buildEditFormData/);
assert.match(imageApiSource, /formData\.append\('image', blob/);
assert.match(imageApiSource, /\/images\/edits/);
assert.match(imageApiSource, /shouldTryEditFirst/);
assert.match(imageApiSource, /imageMode === 'edit'/);
assert.match(settingsSource, /Force image edit/);
assert.match(settingsSource, /Force text generation/);

console.log('reference image edit contract ok');
