import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Paperclip, X, Sparkles, MessageSquare, Languages, Store, SlidersHorizontal, Pin, ArrowUpCircle, Layers3 } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { cn } from '../lib/utils';
import { t } from '../lib/i18n';
import { PromptStore } from './PromptStore';
import { useAssetActions } from '../lib/useAssetActions';

function isLikelyImageUrl(value: string) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    return /\.(png|jpe?g|gif|webp|bmp|svg|avif)(\?.*)?$/i.test(url.pathname) || /image/i.test(url.search);
  } catch {
    return false;
  }
}

export function ChatInput({ onSubmit }: { onSubmit: (text: string, referencedAssets: string[]) => void }) {
  const { state, dispatch } = useAppStore();
  const { addUploadAssetFromFile, addUploadAssetFromUrl, removeAsset } = useAssetActions();
  const [text, setText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { locale } = state;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
    }
  }, [text]);

  const allAssetIds = Object.keys(state.assets).filter((id) => state.assets[id]?.workspaceId === state.activeWorkspaceId);
  const carryForwardAssets = state.promptBuilder.carryForwardAssetIds.filter((id) => allAssetIds.includes(id));
  const selectedCharacters = state.promptBuilder.selectedCharacterIds.map((id) => state.characters[id]).filter(Boolean);
  const referencedAssets = useMemo(
    () => Array.from(new Set([...carryForwardAssets, ...allAssetIds.filter((id) => text.includes(`@${id}`))])),
    [allAssetIds, carryForwardAssets, text],
  );

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);

    const lastWord = value.split(/\s/).pop();
    if (lastWord && lastWord.startsWith('@')) {
      setShowMentions(true);
      setMentionFilter(lastWord.slice(1).toLowerCase());
    } else {
      setShowMentions(false);
    }
  };

  const handleSubmit = () => {
    if (!text.trim() && referencedAssets.length === 0) return;
    onSubmit(text, referencedAssets);
    setText('');
    dispatch({ type: 'SET_QUOTED_MESSAGE', payload: null });
  };

  const togglePromptStore = () => {
    dispatch({
      type: 'SET_PROMPT_BUILDER',
      payload: { isPromptStoreOpen: !state.promptBuilder.isPromptStoreOpen },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const insertMention = (assetId: string) => {
    const words = text.split(/\s/);
    words.pop();
    const newText = [...words, `@${assetId} `].join(' ');
    setText(newText.startsWith(' ') ? newText.trimStart() : newText);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const appendAssetMention = (assetId: string) => {
    setText((prev) => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + `@${assetId} `);
  };

  const removeAssetMention = (assetId: string) => {
    const mentionPattern = new RegExp(`(^|\\s)@${assetId}(?=\\s|$)`, 'g');
    setText((prev) => prev.replace(mentionPattern, ' ').replace(/\s{2,}/g, ' ').trim());
  };

  const handleRemoveAsset = (assetId: string) => {
    removeAsset(assetId, { onRemoved: removeAssetMention });
  };

  const createAssetFromFile = async (file: File) => {
    try {
      await addUploadAssetFromFile(file, {
        onAdded: (asset) => appendAssetMention(asset.id),
      });
    } catch (err) {
      console.error('Failed to parse image', err);
    }
  };

  const createAssetFromUrl = (imageUrl: string) => {
    try {
      addUploadAssetFromUrl(imageUrl, {
        onAdded: (asset) => appendAssetMention(asset.id),
      });
      return true;
    } catch (err) {
      console.error('Failed to parse image URL', err);
      return false;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        await createAssetFromFile(file);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items || []);
    const imageItem = items.find((item) => item.type.startsWith('image/'));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (!file) return;
      e.preventDefault();
      await createAssetFromFile(file);
      return;
    }

    const pastedText = e.clipboardData.getData('text').trim();
    if (isLikelyImageUrl(pastedText)) {
      e.preventDefault();
      if (createAssetFromUrl(pastedText)) {
        setShowMentions(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!Array.from(e.dataTransfer.types || []).includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    const files = Array.from(e.dataTransfer.files || []).filter((file) => file.type.startsWith('image/'));
    if (!files.length) {
      setIsDragOver(false);
      return;
    }

    e.preventDefault();
    setIsDragOver(false);
    for (const file of files) {
      await createAssetFromFile(file);
    }
  };

  const workspaceMessages = state.messages.filter((message) => message.workspaceId === state.activeWorkspaceId);
  const quotedMessage = state.quotedMessageId ? workspaceMessages.find((m) => m.id === state.quotedMessageId) : null;
  const recentGeneratedAssets = allAssetIds
    .map((id) => state.assets[id])
    .filter(Boolean)
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.createdAt - a.createdAt)
    .slice(0, 6);
  const canSubmit = Boolean(text.trim() || referencedAssets.length);

  return (
    <div className="relative w-full max-w-6xl mx-auto px-4 md:px-8 pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-8 pt-2 mt-auto shrink-0">
      {state.inputMode === 'image' && state.promptBuilder.isPromptStoreOpen && (
        <PromptStore
          onApplyPrompt={(prompt) => {
            setText(prompt);
            dispatch({ type: 'SET_PROMPT_BUILDER', payload: { isPromptStoreOpen: false } });
          }}
          onClose={() => dispatch({ type: 'SET_PROMPT_BUILDER', payload: { isPromptStoreOpen: false } })}
        />
      )}

      <div className="mt-5 rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(217,119,255,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_25%),rgba(16,16,18,0.9)] p-3 md:p-4 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_30%,transparent_70%,rgba(255,255,255,0.04))]" />

        <div className="relative flex flex-wrap items-center gap-2 mb-3">
          <button
            onClick={() => dispatch({ type: 'SET_INPUT_MODE', payload: 'chat' })}
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all border',
              state.inputMode === 'chat'
                ? 'border-white/20 bg-white/10 text-white'
                : 'border-white/6 bg-black/15 text-white/55 hover:text-white',
            )}
          >
            <MessageSquare className="w-4 h-4" />
            {t(locale, 'aiChatVision')}
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_INPUT_MODE', payload: 'image' })}
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all border',
              state.inputMode === 'image'
                ? 'border-fuchsia-300/30 bg-fuchsia-400/12 text-fuchsia-100'
                : 'border-white/6 bg-black/15 text-white/55 hover:text-white',
            )}
          >
            <Sparkles className="w-4 h-4" />
            {t(locale, 'imageGeneration')}
          </button>

          {state.inputMode === 'image' && (
            <>
              <button
                onClick={togglePromptStore}
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all border',
                  state.promptBuilder.isPromptStoreOpen
                    ? 'border-amber-200/30 bg-amber-100/12 text-amber-50'
                    : 'border-white/6 bg-black/15 text-white/55 hover:text-white',
                )}
              >
                {state.promptBuilder.isPromptStoreOpen ? <SlidersHorizontal className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                {state.promptBuilder.isPromptStoreOpen ? (locale === 'zh' ? '关闭标签商店' : 'Close Prompt Store') : (locale === 'zh' ? '打开标签商店' : 'Open Prompt Store')}
              </button>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-black/15 px-3 py-2 text-xs text-white/55">
                <Layers3 className="w-4 h-4 text-fuchsia-200" />
                {locale === 'zh'
                  ? `连续参考 ${carryForwardAssets.length} 张`
                  : `${carryForwardAssets.length} carry-forward refs`}
              </div>
            </>
          )}

          <div className="ml-auto flex items-center gap-2 rounded-full border border-white/8 bg-black/15 px-2 py-1">
            <Languages className="w-4 h-4 text-white/50" />
            <button
              onClick={() => dispatch({ type: 'SET_LOCALE', payload: 'zh' })}
              className={cn('rounded-full px-3 py-1 text-xs', state.locale === 'zh' ? 'bg-white text-black' : 'text-white/55')}
            >
              中文
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_LOCALE', payload: 'en' })}
              className={cn('rounded-full px-3 py-1 text-xs', state.locale === 'en' ? 'bg-white text-black' : 'text-white/55')}
            >
              EN
            </button>
          </div>
        </div>

        {quotedMessage && (
          <div className="relative mb-3 flex items-start rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/35 mb-1">{t(locale, 'quoteReplyingTo')}</div>
              <div className="text-sm text-white/70 truncate">{quotedMessage.content || '[Image]'}</div>
            </div>
            <button onClick={() => dispatch({ type: 'SET_QUOTED_MESSAGE', payload: null })} className="text-white/45 hover:text-white ml-3">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {state.inputMode === 'image' && selectedCharacters.length > 0 && (
          <div className="mb-3 rounded-[22px] border border-cyan-300/12 bg-cyan-300/8 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-50/70">
                {locale === 'zh' ? `已选人物 ${selectedCharacters.length}/3` : `Selected characters ${selectedCharacters.length}/3`}
              </div>
              <button
                type="button"
                onClick={togglePromptStore}
                className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] text-cyan-50 hover:bg-cyan-300/16"
              >
                {locale === 'zh' ? '管理人物' : 'Manage characters'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedCharacters.map((character) => (
                <div
                  key={character.id}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-300/18 bg-black/20 px-3 py-2 text-xs text-cyan-50"
                >
                  <span className="max-w-[10rem] truncate">{character.name}</span>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'TOGGLE_CHARACTER_SELECTION', payload: character.id })}
                    className="rounded-full bg-white/10 p-1 text-white/70 hover:bg-white/20 hover:text-white"
                    aria-label={locale === 'zh' ? `移除人物 ${character.name}` : `Remove character ${character.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {showMentions && allAssetIds.length > 0 && (
          <div className="absolute bottom-full left-4 mb-3 w-72 rounded-3xl border border-white/10 bg-[#121217]/95 p-2 shadow-2xl z-50">
            <div className="px-3 py-2 text-[11px] uppercase tracking-[0.25em] text-white/35">{t(locale, 'selectImageReference')}</div>
            {allAssetIds
              .filter((id) => id.toLowerCase().includes(mentionFilter))
              .slice(0, 6)
              .map((id) => (
                <button
                  key={id}
                  onClick={() => insertMention(id)}
                  className="flex items-center gap-3 w-full rounded-2xl p-2 text-left hover:bg-white/8"
                >
                  <img src={state.assets[id].url} className="w-10 h-10 rounded-xl object-cover" alt="ref" />
                  <span className="text-sm text-white/85 font-mono">{id}</span>
                </button>
              ))}
          </div>
        )}

        <div
          className={cn(
            'relative rounded-[24px] border bg-black/15 px-3 md:px-4 py-3 transition-colors',
            isDragOver ? 'border-fuchsia-200/45 bg-fuchsia-300/10' : 'border-white/8',
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {state.inputMode === 'image' && recentGeneratedAssets.length > 0 && (
            <div className="mb-3 rounded-[22px] border border-white/8 bg-white/[0.03] p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/38">
                  {locale === 'zh' ? '连续创作参考轨道' : 'Continuity reference rail'}
                </div>
                <div className="text-xs text-white/38">
                  {locale === 'zh' ? '置顶 / 强度 / 一键延续' : 'Pin / strength / carry forward'}
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {recentGeneratedAssets.map((asset) => {
                  const isCarried = carryForwardAssets.includes(asset.id);
                  const strength = asset.referenceStrength || 'balanced';
                  return (
                    <div key={asset.id} className="min-w-[172px] rounded-[20px] border border-white/8 bg-black/25 p-2.5">
                      <div className="relative overflow-hidden rounded-[16px] border border-white/8">
                        <img src={asset.url} alt={asset.id} className="h-28 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveAsset(asset.id)}
                          className="absolute left-2 top-2 rounded-full bg-black/55 p-2 text-white/80 backdrop-blur-md transition hover:bg-black/75 hover:text-white"
                          aria-label={locale === 'zh' ? '删除参考图' : 'Delete reference image'}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => dispatch({ type: 'UPDATE_ASSET_REFERENCE', payload: { id: asset.id, pinned: !asset.pinned } })}
                          className={cn(
                            'absolute right-2 top-2 rounded-full p-2 backdrop-blur-md transition',
                            asset.pinned ? 'bg-amber-200/90 text-black' : 'bg-black/45 text-white/80 hover:bg-black/65',
                          )}
                        >
                          <Pin className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="truncate font-mono text-[11px] text-white/65">@{asset.id}</div>
                        <button
                          type="button"
                          onClick={() => dispatch({ type: 'TOGGLE_CARRY_FORWARD_ASSET', payload: asset.id })}
                          className={cn(
                            'rounded-full px-2.5 py-1 text-[11px] transition',
                            isCarried ? 'bg-fuchsia-300/20 text-fuchsia-100' : 'bg-white/8 text-white/55 hover:bg-white/12',
                          )}
                        >
                          {isCarried ? (locale === 'zh' ? '已延续' : 'Carried') : (locale === 'zh' ? '延续' : 'Carry')}
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-1 text-[11px]">
                        {[
                          { value: 'subtle', label: locale === 'zh' ? '轻' : 'Subtle' },
                          { value: 'balanced', label: locale === 'zh' ? '中' : 'Balanced' },
                          { value: 'strong', label: locale === 'zh' ? '强' : 'Strong' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => dispatch({ type: 'UPDATE_ASSET_REFERENCE', payload: { id: asset.id, referenceStrength: option.value as 'subtle' | 'balanced' | 'strong' } })}
                            className={cn(
                              'rounded-full px-2 py-1 transition',
                              strength === option.value ? 'bg-white text-black' : 'bg-white/8 text-white/55 hover:bg-white/12',
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setText((prev) => `${prev}${prev.trim() ? '\n' : ''}@${asset.id} ${locale === 'zh' ? '延续上一张图的主体气质与构图。' : 'Continue the subject mood and composition from this image.'}`)}
                        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs text-white/70 hover:bg-white/10"
                      >
                        <ArrowUpCircle className="h-3.5 w-3.5" />
                        {locale === 'zh' ? '作为下一张起点' : 'Use as next starting point'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={state.inputMode === 'chat' ? t(locale, 'inputPlaceholderChat') : t(locale, 'inputPlaceholderImage')}
            className="w-full bg-transparent text-white placeholder:text-white/28 outline-none resize-none min-h-[72px] max-h-72 text-[15px] leading-7"
            rows={1}
          />
          <div className="mt-2 text-xs text-white/36">
            {locale === 'zh' ? '支持粘贴图片、粘贴图片 URL，或直接把图片拖到这里。' : 'Paste an image, paste an image URL, or drag an image here.'}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-sm text-white/70 hover:text-white"
              >
                <Paperclip className="w-4 h-4" />
                {t(locale, 'uploadRefImage')}
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
              <div className="text-xs text-white/40">
                {locale === 'zh'
                  ? `当前工作区已带入 ${workspaceMessages.length} 条消息和 ${allAssetIds.length} 张图片上下文`
                  : `${workspaceMessages.length} messages and ${allAssetIds.length} images are in this workspace context`}
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {state.inputMode === 'image' ? t(locale, 'generate') : t(locale, 'send')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
