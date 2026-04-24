import React from 'react';
import { Sparkles, Wand2, Palette, Camera, SunMedium, Gem, Bookmark, Layers3 } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { promptPresets, tagDefinitions } from '../lib/promptLibrary';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';

const groupIconMap = {
  quality: Sparkles,
  lighting: SunMedium,
  composition: Camera,
  style: Palette,
  camera: Wand2,
  mood: Sparkles,
  material: Gem,
} as const;

export function PromptStore({ onApplyPrompt }: { onApplyPrompt: (prompt: string) => void }) {
  const { state, dispatch } = useAppStore();
  const { locale, promptBuilder } = state;
  const selectedPreset = promptPresets.find((preset) => preset.id === promptBuilder.selectedPresetId) || null;
  const selectedTags = tagDefinitions.filter((tag) => promptBuilder.selectedTagIds.includes(tag.id));

  const composedPrompt = [
    selectedPreset?.prompt[locale],
    ...selectedTags.map((tag) => tag.value),
    promptBuilder.customSuffix.trim(),
  ]
    .filter(Boolean)
    .join(', ');

  const toggleTag = (id: string) => {
    const exists = promptBuilder.selectedTagIds.includes(id);
    dispatch({
      type: 'SET_PROMPT_BUILDER',
      payload: {
        selectedTagIds: exists
          ? promptBuilder.selectedTagIds.filter((tagId) => tagId !== id)
          : [...promptBuilder.selectedTagIds, id],
      },
    });
  };

  return (
    <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] backdrop-blur-2xl shadow-[0_24px_100px_rgba(0,0,0,0.35)] p-4 md:p-6 space-y-5 max-h-[46vh] overflow-hidden flex flex-col">
      <div className="flex items-start justify-between gap-4 flex-wrap shrink-0">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/40 mb-2">{t(locale, 'promptStore')}</p>
          <h3 className="text-lg md:text-2xl text-white font-light tracking-wide">{t(locale, 'promptStoreDesc')}</h3>
        </div>
        <div className="rounded-full border border-amber-200/20 bg-amber-100/10 px-3 py-1 text-[11px] text-amber-100/80">
          {locale === 'zh' ? '按风格 / 构图 / 光线精心策划' : 'Curated by style / composition / light'}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] min-h-0 flex-1 overflow-hidden">
        <div className="space-y-4 min-h-0 overflow-y-auto pr-1">
          <div className="rounded-[26px] border border-white/8 bg-black/15 p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/40 mb-3">
              <Bookmark className="w-4 h-4" />
              {t(locale, 'presets')}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {promptPresets.map((preset) => {
                const active = promptBuilder.selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => dispatch({ type: 'SET_PROMPT_BUILDER', payload: { selectedPresetId: active ? null : preset.id } })}
                    className={cn(
                      'rounded-3xl p-4 text-left border transition-all duration-300',
                      active
                        ? 'border-fuchsia-300/40 bg-gradient-to-br from-fuchsia-300/20 to-amber-100/10 shadow-[0_16px_50px_rgba(205,130,255,0.18)]'
                        : 'border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/8',
                    )}
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="text-sm text-white font-medium">{preset.title[locale]}</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/35">{preset.category}</span>
                    </div>
                    <p className="text-sm text-white/65 leading-6">{preset.description[locale]}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {preset.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] text-white/60">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[26px] border border-white/8 bg-black/15 p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/40 mb-3">
              <Layers3 className="w-4 h-4" />
              {t(locale, 'tags')}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {tagDefinitions.map((tag) => {
                const Icon = groupIconMap[tag.group];
                const active = promptBuilder.selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      'rounded-2xl border p-3 text-left transition-all duration-300',
                      active
                        ? 'border-emerald-300/30 bg-emerald-300/12'
                        : 'border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/8',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-white/8 p-2 text-white/70">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm text-white font-medium">{tag.label[locale]}</div>
                        <div className="text-xs text-white/50 mt-1 leading-5">{tag.description[locale]}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-[26px] border border-white/10 bg-[#120f18]/88 p-4 md:p-5 flex flex-col gap-4 min-h-0 overflow-y-auto">
          <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.28em] text-white/40 mb-2">{t(locale, 'customPrompt')}</div>
            <textarea
              value={promptBuilder.customSuffix}
              onChange={(e) => dispatch({ type: 'SET_PROMPT_BUILDER', payload: { customSuffix: e.target.value } })}
              placeholder={locale === 'zh' ? '补充主体、色彩、镜头语言、服装、场景细节…' : 'Add subject, color palette, camera angle, wardrobe, scene details...'}
              className="w-full min-h-28 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85 placeholder:text-white/25 outline-none focus:border-fuchsia-300/30"
            />
          </div>

          {selectedTags.length > 0 && (
            <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/40 mb-3">
                {locale === 'zh' ? '已选标签' : 'Selected tags'}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className="rounded-full border border-emerald-300/20 bg-emerald-300/12 px-3 py-1.5 text-xs text-emerald-50"
                  >
                    {tag.label[locale]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-black/25 border border-white/8 p-4 space-y-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/40 mb-2">{t(locale, 'suggestedPrompt')}</div>
              <p className="text-sm text-white/80 leading-6 whitespace-pre-wrap break-words">{composedPrompt || '—'}</p>
            </div>
            {selectedPreset?.recommendedNegativePrompt && (
              <div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-white/40 mb-2">{t(locale, 'recommendedNegativePrompt')}</div>
                <p className="text-xs text-white/55 leading-5 break-words">{selectedPreset.recommendedNegativePrompt}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-auto flex-wrap sticky bottom-0 pt-2 bg-[linear-gradient(180deg,rgba(18,15,24,0),rgba(18,15,24,0.94)_28%)]">
            <button
              onClick={() => onApplyPrompt(composedPrompt)}
              disabled={!composedPrompt}
              className="flex-1 min-w-40 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-amber-300 px-4 py-3 text-sm font-semibold text-black disabled:opacity-40"
            >
              {t(locale, 'applyToInput')}
            </button>
            <button
              onClick={() => dispatch({ type: 'RESET_PROMPT_BUILDER' })}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70 hover:bg-white/6"
            >
              {t(locale, 'clear')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
