import React, { useMemo, useRef } from 'react';
import {
  Sparkles,
  Wand2,
  Palette,
  Camera,
  SunMedium,
  Gem,
  Bookmark,
  Layers3,
  X,
  Heart,
  Search,
  Clock3,
  Flame,
  Star,
  UserRound,
  Users,
  Plus,
  Trash2,
  Pencil,
  ImagePlus,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { promptPresets, tagDefinitions } from '../lib/promptLibrary';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';
import { CharacterProfile, PromptPresetCategory, PromptTagGroup } from '../types';
import { useCharacterProfiles } from '../lib/useCharacterProfiles';
import { useCharacterForm } from '../lib/useCharacterForm';

const groupIconMap = {
  quality: Sparkles,
  lighting: SunMedium,
  composition: Camera,
  style: Palette,
  camera: Wand2,
  mood: Sparkles,
  material: Gem,
} as const;

const presetCategoryOrder: Array<PromptPresetCategory | 'all'> = ['all', 'portrait', 'cinematic', 'illustration', 'product', 'space'];
const tagGroupOrder: Array<PromptTagGroup | 'all'> = ['all', 'quality', 'lighting', 'composition', 'style', 'camera', 'mood', 'material'];

function CharacterEditorModal({
  locale,
  form,
  isOpen,
  onClose,
  onChange,
  onSave,
  onReset,
  onUploadCoverFile,
  onUploadReferenceFiles,
}: {
  locale: 'zh' | 'en';
  form: {
    id: string | null;
    name: string;
    title: string;
    descriptionZh: string;
    descriptionEn: string;
    visualPromptZh: string;
    visualPromptEn: string;
    stylePromptZh: string;
    stylePromptEn: string;
    coverImageUrl: string;
    referenceImageUrlsText: string;
    tagsText: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onChange: (field: keyof typeof form, value: string) => void;
  onSave: () => void;
  onReset: () => void;
  onUploadCoverFile: (file: File) => Promise<unknown>;
  onUploadReferenceFiles: (files: FileList | File[]) => Promise<unknown>;
}) {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[110] flex items-center justify-center p-4 md:p-6">
      <button className="absolute inset-0 bg-black/78 backdrop-blur-md" onClick={onClose} aria-label="Close character editor" />
      <section className="relative z-10 w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-[30px] border border-white/10 bg-[#100d16]/96 p-5 md:p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.32em] text-cyan-100/55">
              {locale === 'zh' ? '人物资料编辑器' : 'Character editor'}
            </div>
            <h3 className="mt-2 text-xl text-white font-light">
              {form.id ? (locale === 'zh' ? '编辑人物设定' : 'Edit character profile') : (locale === 'zh' ? '新建人物设定' : 'Create character profile')}
            </h3>
            <p className="mt-2 text-sm text-white/55 leading-6">
              {locale === 'zh'
                ? '把人物外观、风格和参考图整理成单独档案，后续可以直接多选参与生图。'
                : 'Turn a character appearance, style, and references into a reusable profile for future image generation.'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full border border-white/10 bg-white/6 p-2 text-white/55 hover:bg-white/10 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder={locale === 'zh' ? '人物名称' : 'Character name'}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none"
            />
            <input
              value={form.title}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder={locale === 'zh' ? '人物身份 / 角色标签' : 'Role / title'}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <textarea
              value={form.descriptionZh}
              onChange={(e) => onChange('descriptionZh', e.target.value)}
              placeholder={locale === 'zh' ? '中文简介' : 'Chinese summary'}
              className="min-h-24 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none"
            />
            <textarea
              value={form.descriptionEn}
              onChange={(e) => onChange('descriptionEn', e.target.value)}
              placeholder={locale === 'zh' ? '英文简介' : 'English summary'}
              className="min-h-24 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <textarea
              value={form.visualPromptZh}
              onChange={(e) => onChange('visualPromptZh', e.target.value)}
              placeholder={locale === 'zh' ? '中文外观提示词：脸、发型、服装、体型、辨识度特征' : 'Chinese appearance prompt: face, hair, outfit, body shape, signature traits'}
              className="min-h-32 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none"
            />
            <textarea
              value={form.visualPromptEn}
              onChange={(e) => onChange('visualPromptEn', e.target.value)}
              placeholder={locale === 'zh' ? '英文外观提示词' : 'English appearance prompt'}
              className="min-h-32 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <textarea
              value={form.stylePromptZh}
              onChange={(e) => onChange('stylePromptZh', e.target.value)}
              placeholder={locale === 'zh' ? '中文风格提示词（可选）' : 'Chinese style prompt (optional)'}
              className="min-h-24 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none"
            />
            <textarea
              value={form.stylePromptEn}
              onChange={(e) => onChange('stylePromptEn', e.target.value)}
              placeholder={locale === 'zh' ? '英文风格提示词（可选）' : 'English style prompt (optional)'}
              className="min-h-24 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none"
            />
          </div>

          <div className="rounded-[22px] border border-cyan-300/12 bg-cyan-300/6 p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-cyan-50/70 mb-3">
              <ImagePlus className="w-4 h-4" />
              {locale === 'zh' ? '参考图与封面' : 'References and cover'}
            </div>
            <div className="space-y-3">
              <div className="grid sm:grid-cols-[1fr_auto] gap-3">
                <input
                  value={form.coverImageUrl}
                  onChange={(e) => onChange('coverImageUrl', e.target.value)}
                  placeholder={locale === 'zh' ? '封面图 URL（可选）' : 'Cover image URL (optional)'}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none"
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50 hover:bg-cyan-300/16"
                >
                  {locale === 'zh' ? '上传封面图' : 'Upload cover'}
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      await onUploadCoverFile(file);
                    }
                    e.currentTarget.value = '';
                  }}
                />
              </div>
              <textarea
                value={form.referenceImageUrlsText}
                onChange={(e) => onChange('referenceImageUrlsText', e.target.value)}
                placeholder={locale === 'zh' ? '参考图 URL，每行一条，最多 4 条' : 'Reference image URLs, one per line, up to 4'}
                className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => referenceInputRef.current?.click()}
                  className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50 hover:bg-cyan-300/16"
                >
                  {locale === 'zh' ? '上传本地参考图' : 'Upload local references'}
                </button>
                <div className="text-xs text-white/45">
                  {locale === 'zh' ? '支持本地图片或 URL，统一保存到人物档案中。' : 'Use local images or URLs. Both are saved into the character profile.'}
                </div>
                <input
                  ref={referenceInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    if (e.target.files?.length) {
                      await onUploadReferenceFiles(e.target.files);
                    }
                    e.currentTarget.value = '';
                  }}
                />
              </div>
              <input
                value={form.tagsText}
                onChange={(e) => onChange('tagsText', e.target.value)}
                placeholder={locale === 'zh' ? '标签，逗号分隔（可选）' : 'Tags, comma separated (optional)'}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3 flex-wrap">
          <button
            onClick={onSave}
            disabled={!form.name.trim() || !form.visualPromptZh.trim() || !form.visualPromptEn.trim()}
            className="rounded-2xl bg-cyan-200 px-4 py-3 text-sm font-semibold text-black disabled:opacity-40"
          >
            {form.id ? (locale === 'zh' ? '保存人物' : 'Save character') : (locale === 'zh' ? '创建人物' : 'Create character')}
          </button>
          <button onClick={onReset} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70 hover:bg-white/6">
            {locale === 'zh' ? '清空表单' : 'Clear form'}
          </button>
        </div>
      </section>
    </div>
  );
}

export function PromptStore({ onApplyPrompt, onClose }: { onApplyPrompt: (prompt: string) => void; onClose: () => void }) {
  const { state, dispatch } = useAppStore();
  const { locale, promptBuilder } = state;
  const {
    filteredCharacters,
    selectedCharacters,
    favoriteCharacters,
    recentCharacters,
    selectedCharacterIds,
    favoriteCharacterIds,
    characterSearch,
    toggleCharacter,
    toggleFavoriteCharacter,
    removeCharacter,
    setCharacterSearch,
  } = useCharacterProfiles();
  const {
    form: characterForm,
    isEditorOpen: isCharacterEditorOpen,
    openEditor: openCharacterEditor,
    closeEditor: closeCharacterEditor,
    updateField: handleCharacterFormChange,
    resetForm: resetCharacterForm,
    uploadCoverFile,
    appendReferenceFiles,
    saveCharacter,
  } = useCharacterForm();

  const presetCategoryLabels: Record<PromptPresetCategory | 'all', string> = {
    all: t(locale, 'all'),
    portrait: t(locale, 'categoryPortrait'),
    cinematic: t(locale, 'categoryCinematic'),
    illustration: t(locale, 'categoryIllustration'),
    product: t(locale, 'categoryProduct'),
    space: t(locale, 'categorySpace'),
  };

  const tagGroupLabels: Record<PromptTagGroup | 'all', string> = {
    all: t(locale, 'all'),
    quality: t(locale, 'tagGroupQuality'),
    lighting: t(locale, 'tagGroupLighting'),
    composition: t(locale, 'tagGroupComposition'),
    style: t(locale, 'tagGroupStyle'),
    camera: t(locale, 'tagGroupCamera'),
    mood: t(locale, 'tagGroupMood'),
    material: t(locale, 'tagGroupMaterial'),
  };

  const selectedPreset = promptPresets.find((preset) => preset.id === promptBuilder.selectedPresetId) || null;
  const selectedTags = tagDefinitions.filter((tag) => promptBuilder.selectedTagIds.includes(tag.id));

  const favoritePresets = useMemo(
    () => promptBuilder.favoritePresetIds.map((id) => promptPresets.find((preset) => preset.id === id)).filter(Boolean),
    [promptBuilder.favoritePresetIds],
  );

  const recentPresets = useMemo(
    () => promptBuilder.recentPresetIds.map((id) => promptPresets.find((preset) => preset.id === id)).filter(Boolean),
    [promptBuilder.recentPresetIds],
  );

  const favoriteTags = useMemo(
    () => promptBuilder.favoriteTagIds.map((id) => tagDefinitions.find((tag) => tag.id === id)).filter(Boolean),
    [promptBuilder.favoriteTagIds],
  );

  const recentTags = useMemo(
    () => promptBuilder.recentTagIds.map((id) => tagDefinitions.find((tag) => tag.id === id)).filter(Boolean),
    [promptBuilder.recentTagIds],
  );

  const filteredPresets = useMemo(() => {
    const keyword = promptBuilder.presetSearch.trim().toLowerCase();
    return promptPresets.filter((preset) => {
      const matchesCategory = promptBuilder.activePresetCategory === 'all' || preset.category === promptBuilder.activePresetCategory;
      const haystack = [preset.title.zh, preset.title.en, preset.description.zh, preset.description.en, ...preset.tags].join(' ').toLowerCase();
      const matchesKeyword = !keyword || haystack.includes(keyword);
      return matchesCategory && matchesKeyword;
    });
  }, [promptBuilder.activePresetCategory, promptBuilder.presetSearch]);

  const filteredTags = useMemo(() => {
    const keyword = promptBuilder.tagSearch.trim().toLowerCase();
    return tagDefinitions.filter((tag) => {
      const matchesGroup = promptBuilder.activeTagGroup === 'all' || tag.group === promptBuilder.activeTagGroup;
      const haystack = [tag.label.zh, tag.label.en, tag.description.zh, tag.description.en, tag.value].join(' ').toLowerCase();
      const matchesKeyword = !keyword || haystack.includes(keyword);
      return matchesGroup && matchesKeyword;
    });
  }, [promptBuilder.activeTagGroup, promptBuilder.tagSearch]);

  const composedPrompt = [selectedPreset?.prompt[locale], ...selectedTags.map((tag) => tag.value), promptBuilder.customSuffix.trim()]
    .filter(Boolean)
    .join(', ');

  const characterPromptPreview = selectedCharacters
    .map((character, index) => {
      const promptParts = [character.visualPrompt[locale], character.stylePrompt?.[locale]].filter(Boolean).join(', ');
      return `${index + 1}. ${character.name}${character.title ? ` (${character.title})` : ''}: ${promptParts}`;
    })
    .join('\n');

  const characterReferenceCount = selectedCharacters.reduce(
    (count, character) => count + Math.min(character.referenceImageUrls.length, 2),
    0,
  );

  const handlePresetSelect = (presetId: string) => {
    const active = promptBuilder.selectedPresetId === presetId;
    dispatch({ type: 'SET_PROMPT_BUILDER', payload: { selectedPresetId: active ? null : presetId } });
    if (!active) dispatch({ type: 'MARK_RECENT_PRESET', payload: presetId });
  };

  const toggleTag = (id: string) => {
    const exists = promptBuilder.selectedTagIds.includes(id);
    dispatch({
      type: 'SET_PROMPT_BUILDER',
      payload: {
        selectedTagIds: exists ? promptBuilder.selectedTagIds.filter((tagId) => tagId !== id) : [...promptBuilder.selectedTagIds, id],
      },
    });
    if (!exists) dispatch({ type: 'MARK_RECENT_TAG', payload: id });
  };

  const renderPresetCard = (preset: (typeof promptPresets)[number]) => {
    const active = promptBuilder.selectedPresetId === preset.id;
    const isFavorite = promptBuilder.favoritePresetIds.includes(preset.id);

    return (
      <div
        key={preset.id}
        className={cn(
          'rounded-3xl p-4 text-left border transition-all duration-300',
          active
            ? 'border-fuchsia-300/40 bg-gradient-to-br from-fuchsia-300/20 to-amber-100/10 shadow-[0_16px_50px_rgba(205,130,255,0.18)]'
            : 'border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/8',
        )}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <button onClick={() => handlePresetSelect(preset.id)} className="flex-1 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-white font-medium">{preset.title[locale]}</span>
              {preset.featured && (
                <span className="rounded-full border border-amber-200/15 bg-amber-100/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.24em] text-amber-100/75">
                  {t(locale, 'featured')}
                </span>
              )}
            </div>
            <span className="mt-2 inline-flex rounded-full bg-white/6 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/40">
              {presetCategoryLabels[preset.category]}
            </span>
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_FAVORITE_PRESET', payload: preset.id })}
            className={cn(
              'rounded-full border p-2 transition-colors',
              isFavorite ? 'border-rose-300/30 bg-rose-300/12 text-rose-100' : 'border-white/10 bg-white/5 text-white/45 hover:text-white',
            )}
            aria-label={locale === 'zh' ? '收藏预设' : 'Favorite preset'}
          >
            <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
          </button>
        </div>
        <button onClick={() => handlePresetSelect(preset.id)} className="block w-full text-left">
          <p className="text-sm text-white/65 leading-6">{preset.description[locale]}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {preset.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] text-white/60">
                #{tag}
              </span>
            ))}
          </div>
        </button>
      </div>
    );
  };

  const renderTagCard = (tag: (typeof tagDefinitions)[number]) => {
    const Icon = groupIconMap[tag.group];
    const active = promptBuilder.selectedTagIds.includes(tag.id);
    const isFavorite = promptBuilder.favoriteTagIds.includes(tag.id);

    return (
      <div
        key={tag.id}
        className={cn(
          'rounded-2xl border p-3 transition-all duration-300',
          active ? 'border-emerald-300/30 bg-emerald-300/12' : 'border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/8',
        )}
      >
        <div className="flex items-start gap-3">
          <button onClick={() => toggleTag(tag.id)} className="flex flex-1 items-start gap-3 text-left">
            <div className="rounded-xl bg-white/8 p-2 text-white/70">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-sm text-white font-medium">{tag.label[locale]}</div>
                {tag.featured && (
                  <span className="rounded-full border border-amber-200/15 bg-amber-100/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-amber-100/75">
                    {t(locale, 'featured')}
                  </span>
                )}
              </div>
              <div className="text-xs text-white/50 mt-1 leading-5">{tag.description[locale]}</div>
              <div className="mt-2 text-[11px] text-white/35">{tagGroupLabels[tag.group]}</div>
            </div>
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_FAVORITE_TAG', payload: tag.id })}
            className={cn(
              'rounded-full border p-2 transition-colors',
              isFavorite ? 'border-rose-300/30 bg-rose-300/12 text-rose-100' : 'border-white/10 bg-white/5 text-white/45 hover:text-white',
            )}
            aria-label={locale === 'zh' ? '收藏标签' : 'Favorite tag'}
          >
            <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
          </button>
        </div>
      </div>
    );
  };

  const renderCharacterCard = (character: CharacterProfile) => {
    const active = selectedCharacterIds.includes(character.id);
    const isFavorite = favoriteCharacterIds.includes(character.id);

    return (
      <div
        key={character.id}
        className={cn(
          'rounded-3xl border p-4 transition-all duration-300',
          active
            ? 'border-cyan-300/35 bg-cyan-300/10 shadow-[0_16px_50px_rgba(69,211,255,0.16)]'
            : 'border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/8',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <button onClick={() => toggleCharacter(character.id)} className="flex flex-1 items-start gap-3 text-left">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              {character.coverImageUrl ? (
                <img src={character.coverImageUrl} alt={character.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/35">
                  <UserRound className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-sm font-medium text-white">{character.name}</div>
                {character.title && <span className="text-[11px] text-white/40">{character.title}</span>}
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/58">{character.description[locale]}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/38">
                <span>{character.referenceImageUrls.length} {locale === 'zh' ? '张参考图' : 'references'}</span>
                {(character.tags || []).slice(0, 3).map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavoriteCharacter(character.id)}
              className={cn(
                'rounded-full border p-2 transition-colors',
                isFavorite ? 'border-rose-300/30 bg-rose-300/12 text-rose-100' : 'border-white/10 bg-white/5 text-white/45 hover:text-white',
              )}
              aria-label={locale === 'zh' ? '收藏人物' : 'Favorite character'}
            >
              <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
            </button>
            <button onClick={() => openCharacterEditor(character)} className="rounded-full border border-white/10 bg-white/5 p-2 text-white/45 hover:text-white">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => removeCharacter(character.id)} className="rounded-full border border-rose-300/15 bg-rose-300/8 p-2 text-rose-100/75 hover:bg-rose-300/12">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCompactShelf = (
    title: string,
    icon: React.ReactNode,
    items: Array<{ id: string; label: string; onClick: () => void }>,
    emptyText: string,
  ) => (
    <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/40 mb-3">
        {icon}
        {title}
      </div>
      {items.length ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-white/72 hover:bg-white/10"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/35">{emptyText}</p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 md:p-6">
      <button className="absolute inset-0 bg-black/72 backdrop-blur-md" onClick={onClose} aria-label="Close prompt store" />
      <section className="relative w-full max-w-6xl rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] backdrop-blur-2xl shadow-[0_24px_100px_rgba(0,0,0,0.35)] p-4 md:p-6 space-y-5 max-h-[82vh] overflow-hidden flex flex-col">
        <CharacterEditorModal
          locale={locale}
          form={characterForm}
          isOpen={isCharacterEditorOpen}
          onClose={closeCharacterEditor}
          onChange={handleCharacterFormChange}
          onSave={saveCharacter}
          onReset={resetCharacterForm}
          onUploadCoverFile={uploadCoverFile}
          onUploadReferenceFiles={appendReferenceFiles}
        />

        <div className="flex items-start justify-between gap-4 flex-wrap shrink-0">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/40 mb-2">{t(locale, 'promptStore')}</p>
            <h3 className="text-lg md:text-2xl text-white font-light tracking-wide">{t(locale, 'promptStoreDesc')}</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-amber-200/20 bg-amber-100/10 px-3 py-1 text-[11px] text-amber-100/80">
              {locale === 'zh' ? '按风格 / 构图 / 光线 / 人物管理' : 'Curated by style / composition / light / characters'}
            </div>
            <button onClick={onClose} className="rounded-full border border-white/10 bg-white/6 p-2 text-white/65 hover:bg-white/10 hover:text-white" aria-label={locale === 'zh' ? '关闭标签商店' : 'Close prompt store'}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] min-h-0 flex-1 overflow-hidden">
          <div className="space-y-4 min-h-0 overflow-y-auto pr-1">
            <div className="rounded-[28px] border border-cyan-300/18 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_32%),rgba(255,255,255,0.03)] p-4 md:p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-cyan-50/70">
                    <Users className="w-4 h-4" />
                    {locale === 'zh' ? '人物库' : 'Character library'}
                  </div>
                  <h4 className="mt-2 text-lg text-white font-medium">
                    {locale === 'zh' ? '把固定角色做成可复用的人物档案' : 'Turn recurring characters into reusable profiles'}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-white/58">
                    {locale === 'zh'
                      ? '为角色保存外观提示词、风格提示词和参考图 URL。生图时可以直接多选人物，系统会自动把这些角色带入。'
                      : 'Save appearance prompts, style prompts, and reference image URLs. During generation you can select multiple characters and the app will inject them automatically.'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/72">
                    {selectedCharacters.length}/3 {locale === 'zh' ? '已选人物' : 'selected'}
                  </div>
                  <button
                    onClick={() => openCharacterEditor()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-cyan-200 px-4 py-3 text-sm font-semibold text-black hover:bg-cyan-100"
                  >
                    <Plus className="w-4 h-4" />
                    {locale === 'zh' ? '新建人物档案' : 'Create character'}
                  </button>
                </div>
              </div>
            </div>

            {renderCompactShelf(
              t(locale, 'favoritesShelf'),
              <Heart className="w-4 h-4" />,
              [
                ...favoritePresets.map((preset) => ({ id: `preset-${preset!.id}`, label: preset!.title[locale], onClick: () => handlePresetSelect(preset!.id) })),
                ...favoriteTags.map((tag) => ({ id: `tag-${tag!.id}`, label: tag!.label[locale], onClick: () => toggleTag(tag!.id) })),
                ...favoriteCharacters.map((character) => ({ id: `character-${character!.id}`, label: character!.name, onClick: () => toggleCharacter(character!.id) })),
              ],
              t(locale, 'favoritesEmpty'),
            )}

            {renderCompactShelf(
              t(locale, 'recentShelf'),
              <Clock3 className="w-4 h-4" />,
              [
                ...recentPresets.map((preset) => ({ id: `recent-preset-${preset!.id}`, label: preset!.title[locale], onClick: () => handlePresetSelect(preset!.id) })),
                ...recentTags.map((tag) => ({ id: `recent-tag-${tag!.id}`, label: tag!.label[locale], onClick: () => toggleTag(tag!.id) })),
                ...recentCharacters.map((character) => ({ id: `recent-character-${character!.id}`, label: character!.name, onClick: () => toggleCharacter(character!.id) })),
              ],
              t(locale, 'recentEmpty'),
            )}

            <div className="rounded-[26px] border border-white/8 bg-black/15 p-4 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/40">
                  <Bookmark className="w-4 h-4" />
                  {t(locale, 'presets')}
                </div>
                <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] text-white/45">
                  {filteredPresets.length} {t(locale, 'results')}
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <Search className="w-4 h-4 text-white/35" />
                <input
                  value={promptBuilder.presetSearch}
                  onChange={(e) => dispatch({ type: 'SET_PROMPT_BUILDER', payload: { presetSearch: e.target.value } })}
                  placeholder={t(locale, 'searchPresets')}
                  className="w-full bg-transparent text-sm text-white/85 placeholder:text-white/25 outline-none"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {presetCategoryOrder.map((category) => (
                  <button
                    key={category}
                    onClick={() => dispatch({ type: 'SET_PROMPT_BUILDER', payload: { activePresetCategory: category } })}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs transition-colors',
                      promptBuilder.activePresetCategory === category
                        ? 'border-fuchsia-300/35 bg-fuchsia-300/12 text-fuchsia-100'
                        : 'border-white/10 bg-white/[0.03] text-white/55 hover:text-white',
                    )}
                  >
                    {presetCategoryLabels[category]}
                  </button>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {filteredPresets.map(renderPresetCard)}
              </div>
              {!filteredPresets.length && <p className="text-sm text-white/35">{t(locale, 'noPresetResults')}</p>}
            </div>

            <div className="rounded-[26px] border border-cyan-300/12 bg-cyan-300/6 p-4 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-cyan-50/70">
                  <Users className="w-4 h-4" />
                  {locale === 'zh' ? '人物档案列表' : 'Character profiles'}
                </div>
                <div className="rounded-full border border-cyan-300/18 bg-black/20 px-3 py-1 text-[11px] text-white/70">
                  {filteredCharacters.length} {locale === 'zh' ? '个角色' : 'profiles'}
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                <Search className="w-4 h-4 text-white/35" />
                <input
                  value={characterSearch}
                  onChange={(e) => setCharacterSearch(e.target.value)}
                  placeholder={locale === 'zh' ? '搜索人物名、外观、风格关键词' : 'Search character name, appearance, or style keywords'}
                  className="w-full bg-transparent text-sm text-white/85 placeholder:text-white/25 outline-none"
                />
              </label>

              <div className="grid sm:grid-cols-2 gap-3">
                {filteredCharacters.map(renderCharacterCard)}
              </div>
              {!filteredCharacters.length && (
                <div className="rounded-[22px] border border-dashed border-white/12 bg-black/15 px-4 py-6 text-center text-sm text-white/42">
                  {locale === 'zh' ? '还没有人物档案。点击上方“新建人物档案”开始创建。' : 'No character profiles yet. Use the button above to create your first one.'}
                </div>
              )}
            </div>

            <div className="rounded-[26px] border border-white/8 bg-black/15 p-4 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/40">
                  <Layers3 className="w-4 h-4" />
                  {t(locale, 'tags')}
                </div>
                <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] text-white/45">
                  {filteredTags.length} {t(locale, 'results')}
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <Search className="w-4 h-4 text-white/35" />
                <input
                  value={promptBuilder.tagSearch}
                  onChange={(e) => dispatch({ type: 'SET_PROMPT_BUILDER', payload: { tagSearch: e.target.value } })}
                  placeholder={t(locale, 'searchTags')}
                  className="w-full bg-transparent text-sm text-white/85 placeholder:text-white/25 outline-none"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {tagGroupOrder.map((group) => (
                  <button
                    key={group}
                    onClick={() => dispatch({ type: 'SET_PROMPT_BUILDER', payload: { activeTagGroup: group } })}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs transition-colors',
                      promptBuilder.activeTagGroup === group
                        ? 'border-emerald-300/35 bg-emerald-300/12 text-emerald-100'
                        : 'border-white/10 bg-white/[0.03] text-white/55 hover:text-white',
                    )}
                  >
                    {tagGroupLabels[group]}
                  </button>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {filteredTags.map(renderTagCard)}
              </div>
              {!filteredTags.length && <p className="text-sm text-white/35">{t(locale, 'noTagResults')}</p>}
            </div>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-[#120f18]/88 p-4 md:p-5 flex flex-col gap-4 min-h-0 overflow-y-auto">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/40 mb-2">
                  <Flame className="w-4 h-4" />
                  {t(locale, 'featuredPresets')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {promptPresets.filter((preset) => preset.featured).map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset.id)}
                      className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-white/72 hover:bg-white/10"
                    >
                      {preset.title[locale]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/40 mb-2">
                  <Star className="w-4 h-4" />
                  {t(locale, 'featuredTags')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {tagDefinitions.filter((tag) => tag.featured).map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-white/72 hover:bg-white/10"
                    >
                      {tag.label[locale]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-cyan-300/12 bg-cyan-300/6 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-cyan-50/70">
                  <Users className="w-4 h-4" />
                  {locale === 'zh' ? '人物设定' : 'Character setup'}
                </div>
                <div className="text-xs text-white/42">
                  {selectedCharacters.length}/3 {locale === 'zh' ? '已选人物' : 'selected'}
                </div>
              </div>
              {selectedCharacters.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {selectedCharacters.map((character) => (
                      <button
                        key={character.id}
                        onClick={() => toggleCharacter(character.id)}
                        className="rounded-full border border-cyan-300/20 bg-cyan-300/12 px-3 py-1.5 text-xs text-cyan-50"
                      >
                        {character.name}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs leading-6 text-white/55 whitespace-pre-wrap">{characterPromptPreview}</div>
                  <div className="text-[11px] text-white/40">
                    {locale === 'zh'
                      ? `本次会额外附带 ${characterReferenceCount} 张人物参考图，并明确要求模型同时渲染这些已选人物。`
                      : `${characterReferenceCount} character reference images will be attached, and the model will be asked to render all selected characters together.`}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-white/38">
                  {locale === 'zh' ? '先从左侧人物档案中选择角色。系统会在生图时自动带入这些人物的外观、风格和参考图。' : 'Choose characters from the library on the left. Their appearance, style, and references will be injected automatically during generation.'}
                </p>
              )}
            </div>

            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/40 mb-2">{t(locale, 'customPrompt')}</div>
              <textarea
                value={promptBuilder.customSuffix}
                onChange={(e) => dispatch({ type: 'SET_PROMPT_BUILDER', payload: { customSuffix: e.target.value } })}
                placeholder={locale === 'zh' ? '补充主体、色彩、镜头语言、服装、场景细节...' : 'Add subject, color palette, camera angle, wardrobe, scene details...'}
                className="w-full min-h-28 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85 placeholder:text-white/25 outline-none focus:border-fuchsia-300/30"
              />
            </div>

            {selectedTags.length > 0 && (
              <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-[0.28em] text-white/40 mb-3">{locale === 'zh' ? '已选标签' : 'Selected tags'}</div>
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
              {selectedCharacters.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase tracking-[0.28em] text-white/40 mb-2">
                    {locale === 'zh' ? '人物提示预览' : 'Character prompt preview'}
                  </div>
                  <p className="text-xs text-white/55 leading-6 whitespace-pre-wrap break-words">{characterPromptPreview}</p>
                </div>
              )}
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
              <button onClick={() => dispatch({ type: 'RESET_PROMPT_BUILDER' })} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70 hover:bg-white/6">
                {t(locale, 'clear')}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
