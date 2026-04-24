import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../lib/store';
import { MessageItem } from './MessageItem';
import { Sparkles, Wand2, Languages, ShieldCheck } from 'lucide-react';
import { t } from '../lib/i18n';

export function MessageList() {
  const { state } = useAppStore();
  const locale = state.locale;
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  if (state.messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto w-full max-w-6xl mx-auto px-4 md:px-8 py-10">
        <div className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(216,180,254,0.15),transparent_35%),rgba(255,255,255,0.04)] p-8 md:p-12 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-white/45">
              <Sparkles className="w-4 h-4 text-fuchsia-200" />
              {state.runtimeConfig.sharedProviderLabel}
            </div>
            <h1 className="mt-6 text-4xl md:text-6xl text-white font-light leading-tight tracking-[0.03em]">
              {t(locale, 'heroTitle')}
            </h1>
            <p className="mt-5 text-base md:text-lg text-white/62 leading-8 max-w-2xl">
              {t(locale, 'heroDesc')}
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-[28px] border border-white/8 bg-black/15 p-5">
              <div className="mb-3 inline-flex rounded-2xl bg-fuchsia-400/12 p-3 text-fuchsia-100">
                <Languages className="w-5 h-5" />
              </div>
              <div className="text-white text-lg mb-2">Bilingual UI</div>
              <div className="text-white/55 text-sm leading-6">中文 / English switching across the full workspace and settings flow.</div>
            </div>
            <div className="rounded-[28px] border border-white/8 bg-black/15 p-5">
              <div className="mb-3 inline-flex rounded-2xl bg-amber-300/12 p-3 text-amber-100">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-white text-lg mb-2">Shared model password</div>
              <div className="text-white/55 text-sm leading-6">Enable your env-configured model safely so users can generate without their own API key.</div>
            </div>
            <div className="rounded-[28px] border border-white/8 bg-black/15 p-5">
              <div className="mb-3 inline-flex rounded-2xl bg-emerald-300/12 p-3 text-emerald-100">
                <Wand2 className="w-5 h-5" />
              </div>
              <div className="text-white text-lg mb-2">Prompt tag store</div>
              <div className="text-white/55 text-sm leading-6">Curated presets and visual tags help users write better prompts faster.</div>
            </div>
          </div>

          <div className="mt-10 rounded-[28px] border border-white/8 bg-black/15 p-6 md:p-8">
            <div className="text-[11px] uppercase tracking-[0.32em] text-white/35 mb-3">{t(locale, 'welcomeTitle')}</div>
            <p className="text-white/68 leading-8 max-w-3xl">{t(locale, 'welcomeDesc')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto px-4 md:px-8 scroll-smooth">
      <div className="py-8 space-y-1">
        {state.messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
