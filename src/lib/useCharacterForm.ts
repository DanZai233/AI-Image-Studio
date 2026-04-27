import { useState } from 'react';
import { CharacterProfile } from '../types';
import { useAppStore } from './store';
import { generateId } from './utils';

export type CharacterFormState = {
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

export function createEmptyCharacterForm(): CharacterFormState {
  return {
    id: null,
    name: '',
    title: '',
    descriptionZh: '',
    descriptionEn: '',
    visualPromptZh: '',
    visualPromptEn: '',
    stylePromptZh: '',
    stylePromptEn: '',
    coverImageUrl: '',
    referenceImageUrlsText: '',
    tagsText: '',
  };
}

export function createCharacterForm(profile: CharacterProfile): CharacterFormState {
  return {
    id: profile.id,
    name: profile.name,
    title: profile.title || '',
    descriptionZh: profile.description.zh,
    descriptionEn: profile.description.en,
    visualPromptZh: profile.visualPrompt.zh,
    visualPromptEn: profile.visualPrompt.en,
    stylePromptZh: profile.stylePrompt?.zh || '',
    stylePromptEn: profile.stylePrompt?.en || '',
    coverImageUrl: profile.coverImageUrl || profile.referenceImageUrls[0] || '',
    referenceImageUrlsText: profile.referenceImageUrls.join('\n'),
    tagsText: (profile.tags || []).join(', '),
  };
}

export function useCharacterForm() {
  const { state, dispatch } = useAppStore();
  const [form, setForm] = useState<CharacterFormState>(createEmptyCharacterForm);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const openEditor = (character?: CharacterProfile) => {
    setForm(character ? createCharacterForm(character) : createEmptyCharacterForm());
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setForm(createEmptyCharacterForm());
    setIsEditorOpen(false);
  };

  const updateField = (field: keyof CharacterFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(createEmptyCharacterForm());
  };

  const saveCharacter = () => {
    const name = form.name.trim();
    const visualPromptZh = form.visualPromptZh.trim();
    const visualPromptEn = form.visualPromptEn.trim();
    if (!name || !visualPromptZh || !visualPromptEn) return false;

    const referenceImageUrls = form.referenceImageUrlsText
      .split(/\r?\n/)
      .map((url) => url.trim())
      .filter(Boolean)
      .slice(0, 4);
    const tags = form.tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 8);
    const now = Date.now();
    const id = form.id || generateId('CHAR_');

    dispatch({
      type: 'UPSERT_CHARACTER',
      payload: {
        id,
        name,
        title: form.title.trim() || undefined,
        description: {
          zh: form.descriptionZh.trim() || name,
          en: form.descriptionEn.trim() || name,
        },
        visualPrompt: {
          zh: visualPromptZh,
          en: visualPromptEn,
        },
        stylePrompt: form.stylePromptZh.trim() || form.stylePromptEn.trim()
          ? {
              zh: form.stylePromptZh.trim() || form.stylePromptEn.trim(),
              en: form.stylePromptEn.trim() || form.stylePromptZh.trim(),
            }
          : undefined,
        referenceImageUrls,
        coverImageUrl: form.coverImageUrl.trim() || referenceImageUrls[0] || undefined,
        tags,
        createdAt: form.id ? state.characters[form.id]?.createdAt || now : now,
        updatedAt: now,
      },
    });
    dispatch({ type: 'MARK_RECENT_CHARACTER', payload: id });
    closeEditor();
    return true;
  };

  return {
    form,
    isEditorOpen,
    openEditor,
    closeEditor,
    updateField,
    resetForm,
    saveCharacter,
  };
}
