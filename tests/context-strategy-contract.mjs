import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
const apiSource = await readFile(new URL('../api/generate-image.js', import.meta.url), 'utf8');
const i18nSource = await readFile(new URL('../src/lib/i18n.ts', import.meta.url), 'utf8');
const openaiSource = await readFile(new URL('../src/lib/openai.ts', import.meta.url), 'utf8');
const typesSource = await readFile(new URL('../src/types.ts', import.meta.url), 'utf8');

assert.match(appSource, /IMAGE_CONTEXT_MESSAGE_LIMIT = 6/);
assert.match(appSource, /buildImageGenerationContext/);
assert.match(appSource, /setImageContextSnapshot/);
assert.match(appSource, /contextPreviewTitle/);
assert.match(appSource, /workspaceContinuityHint/);
assert.match(appSource, /contextSnapshot\.summary/);
assert.match(appSource, /workspaceMessages\.slice\(-IMAGE_CONTEXT_MESSAGE_LIMIT\)/);
assert.match(apiSource, /contextMessages = \[\]/);
assert.match(apiSource, /buildContextSnapshot/);
assert.match(apiSource, /contextSnapshot/);
assert.match(openaiSource, /contextMessages: ImageGenerationContextMessage\[\]/);
assert.match(i18nSource, /contextPreviewHint/);
assert.match(i18nSource, /workspaceContinuityLabel/);
assert.match(typesSource, /export interface ContextSnapshot/);

console.log('context strategy contract ok');
