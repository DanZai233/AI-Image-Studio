import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Paperclip, X, Sparkles, MessageSquare, Languages, Wand2, Store, SlidersHorizontal } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { generateId, fileToBase64, cn } from '../lib/utils';
import { ImageAsset } from '../types';
import { t } from '../lib/i18n';
import { PromptStore } from './PromptStore';

export function ChatInput({ onSubmit }: { onSubmit: (text: string, referencedAssets: string[]) => void }) {
  const { state, dispatch } = useAppStore();
  const [text, setText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { locale } = state;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
    }
  }, [text]);

  const allAssetIds = Object.keys(state.assets);
  const referencedAssets = useMemo(() => allAssetIds.filter((id) => text.includes(`@${id}`)), [allAssetIds, text]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const b64 = await fileToBase64(file);
      const id = generateId('IMG_');
      const newAsset: ImageAsset = {
        id,
        name: file.name,
        url: b64,
        source: 'upload',
        createdAt: Date.now(),
      };
      dispatch({ type: 'ADD_ASSET', payload: newAsset });
      setText((prev) => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + `@${id} `);
    } catch (err) {
      console.error('Failed to parse image', err);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const quotedMessage = state.quotedMessageId ? state.messages.find((m) => m.id === state.quotedMessageId) : null;

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

        <div className="relative rounded-[24px] border border-white/8 bg-black/15 px-3 md:px-4 py-3">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={state.inputMode === 'chat' ? t(locale, 'inputPlaceholderChat') : t(locale, 'inputPlaceholderImage')}
            className="w-full bg-transparent text-white placeholder:text-white/28 outline-none resize-none min-h-[72px] max-h-72 text-[15px] leading-7"
            rows={1}
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-sm text-white/70 hover:text-white"
              >
                <Paperclip className="w-4 h-4" />
                {t(locale, 'uploadRefImage')}
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

              {referencedAssets.map((id) => (
                <div key={id} className="flex items-center gap-2 rounded-full border border-white/8 bg-black/20 px-2.5 py-1.5">
                  <img src={state.assets[id]?.url} alt={id} className="w-5 h-5 rounded-full object-cover" />
                  <span className="text-[11px] text-white/70 font-mono">@{id}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!text.trim() && referencedAssets.length === 0}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all',
                text.trim() || referencedAssets.length > 0
                  ? state.inputMode === 'chat'
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-gradient-to-r from-fuchsia-500 to-amber-300 text-black hover:scale-[1.01]'
                  : 'bg-white/8 text-white/30',
              )}
            >
              <Wand2 className="w-4 h-4" />
              {state.inputMode === 'chat' ? t(locale, 'send') : t(locale, 'generate')}
            </button>
          </div>
        </div>
      </div>

      <div className="text-center mt-3">
        <p className="text-[11px] text-white/28">{t(locale, 'verifyInfo')}</p>
      </div>
    </div>
  );
}
