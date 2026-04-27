import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const chatInputSource = await readFile(new URL('../src/components/ChatInput.tsx', import.meta.url), 'utf8');
const messageItemSource = await readFile(new URL('../src/components/MessageItem.tsx', import.meta.url), 'utf8');
const storeSource = await readFile(new URL('../src/lib/store.tsx', import.meta.url), 'utf8');
const typesSource = await readFile(new URL('../src/types.ts', import.meta.url), 'utf8');

assert.match(typesSource, /referenceStrength\?: 'subtle' \| 'balanced' \| 'strong'/);
assert.match(typesSource, /carryForwardAssetIds: string\[\]/);
assert.match(storeSource, /TOGGLE_CARRY_FORWARD_ASSET/);
assert.match(storeSource, /UPDATE_ASSET_REFERENCE/);
assert.match(chatInputSource, /连续创作参考轨道/);
assert.match(chatInputSource, /carry-forward refs/);
assert.match(chatInputSource, /TOGGLE_CARRY_FORWARD_ASSET/);
assert.match(chatInputSource, /referenceStrength/);
assert.match(chatInputSource, /作为下一张起点/);
assert.match(messageItemSource, /ArrowUpCircle/);
assert.match(messageItemSource, /UPDATE_ASSET_REFERENCE/);

console.log('image workflow contract ok');
