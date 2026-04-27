import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const generateImageSource = await readFile(new URL('../api/generate-image.js', import.meta.url), 'utf8');
const chatSource = await readFile(new URL('../api/chat.js', import.meta.url), 'utf8');
const vercelConfigSource = await readFile(new URL('../vercel.json', import.meta.url), 'utf8');

assert.match(generateImageSource, /maxDuration:\s*300/);
assert.match(generateImageSource, /const REQUEST_TIMEOUT_MS = 300000/);
assert.match(chatSource, /maxDuration:\s*300/);
assert.match(chatSource, /const REQUEST_TIMEOUT_MS = 300000/);
assert.match(chatSource, /AbortController/);
assert.match(vercelConfigSource, /"maxDuration"\s*:\s*300/);
assert.match(vercelConfigSource, /"api\/\*\.js"/);

console.log('vercel timeout contract ok');
