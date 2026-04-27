import { useMemo } from 'react';
import { useAppStore } from './store';

export function useCharacterProfiles() {
  const { state, dispatch } = useAppStore();
  const { promptBuilder } = state;

  const characterProfiles = useMemo(
    () =>
      Object.values(state.characters).sort(
        (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || b.updatedAt - a.updatedAt,
      ),
    [state.characters],
  );

  const selectedCharacters = useMemo(
    () => promptBuilder.selectedCharacterIds.map((id) => state.characters[id]).filter(Boolean),
    [promptBuilder.selectedCharacterIds, state.characters],
  );

  const favoriteCharacters = useMemo(
    () => promptBuilder.favoriteCharacterIds.map((id) => state.characters[id]).filter(Boolean),
    [promptBuilder.favoriteCharacterIds, state.characters],
  );

  const recentCharacters = useMemo(
    () => promptBuilder.recentCharacterIds.map((id) => state.characters[id]).filter(Boolean),
    [promptBuilder.recentCharacterIds, state.characters],
  );

  const filteredCharacters = useMemo(() => {
    const keyword = promptBuilder.characterSearch.trim().toLowerCase();
    return characterProfiles.filter((character) => {
      const haystack = [
        character.name,
        character.title || '',
        character.description.zh,
        character.description.en,
        character.visualPrompt.zh,
        character.visualPrompt.en,
        ...(character.tags || []),
      ].join(' ').toLowerCase();
      return !keyword || haystack.includes(keyword);
    });
  }, [characterProfiles, promptBuilder.characterSearch]);

  const toggleCharacter = (id: string) => {
    dispatch({ type: 'TOGGLE_CHARACTER_SELECTION', payload: id });
  };

  const toggleFavoriteCharacter = (id: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE_CHARACTER', payload: id });
  };

  const removeCharacter = (id: string) => {
    dispatch({ type: 'REMOVE_CHARACTER', payload: id });
  };

  const setCharacterSearch = (value: string) => {
    dispatch({ type: 'SET_PROMPT_BUILDER', payload: { characterSearch: value } });
  };

  return {
    characterProfiles,
    filteredCharacters,
    selectedCharacters,
    favoriteCharacters,
    recentCharacters,
    selectedCharacterIds: promptBuilder.selectedCharacterIds,
    favoriteCharacterIds: promptBuilder.favoriteCharacterIds,
    characterSearch: promptBuilder.characterSearch,
    toggleCharacter,
    toggleFavoriteCharacter,
    removeCharacter,
    setCharacterSearch,
  };
}
