import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, AIModelSettings, CharacterProfile, ImageAsset, InputMode, Locale, Message, PromptBuilderState, Workspace } from '../types';
import { runtimeConfig } from './config';

const DEFAULT_WORKSPACE_ID = 'workspace_default';

function createDefaultWorkspace(): Workspace {
  return {
    id: DEFAULT_WORKSPACE_ID,
    name: 'Studio 01',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

type Action =
  | { type: 'SET_SETTINGS'; payload: Partial<AIModelSettings> }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'REMOVE_MESSAGE'; payload: string }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; content: string } }
  | { type: 'MARK_ERROR'; payload: string }
  | { type: 'ADD_ASSET'; payload: ImageAsset }
  | { type: 'REMOVE_ASSET'; payload: string }
  | { type: 'UPSERT_CHARACTER'; payload: CharacterProfile }
  | { type: 'REMOVE_CHARACTER'; payload: string }
  | { type: 'SET_QUOTED_MESSAGE'; payload: string | null }
  | { type: 'SET_INPUT_MODE'; payload: InputMode }
  | { type: 'SET_LOCALE'; payload: Locale }
  | { type: 'SET_PROMPT_BUILDER'; payload: Partial<PromptBuilderState> }
  | { type: 'RESET_PROMPT_BUILDER' }
  | { type: 'TOGGLE_FAVORITE_PRESET'; payload: string }
  | { type: 'TOGGLE_FAVORITE_TAG'; payload: string }
  | { type: 'TOGGLE_FAVORITE_CHARACTER'; payload: string }
  | { type: 'MARK_RECENT_PRESET'; payload: string }
  | { type: 'MARK_RECENT_TAG'; payload: string }
  | { type: 'MARK_RECENT_CHARACTER'; payload: string }
  | { type: 'TOGGLE_CARRY_FORWARD_ASSET'; payload: string }
  | { type: 'TOGGLE_CHARACTER_SELECTION'; payload: string }
  | { type: 'UPDATE_ASSET_REFERENCE'; payload: { id: string; pinned?: boolean; referenceStrength?: 'subtle' | 'balanced' | 'strong' } }
  | { type: 'SET_RUNTIME_CONFIG'; payload: AppState['runtimeConfig'] }
  | { type: 'SET_MOBILE_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'CREATE_WORKSPACE'; payload?: { name?: string } }
  | { type: 'SET_ACTIVE_WORKSPACE'; payload: string }
  | { type: 'RENAME_WORKSPACE'; payload: { id: string; name: string } }
  | { type: 'ARCHIVE_WORKSPACE'; payload: string }
  | { type: 'CLEAR_ACTIVE_WORKSPACE' }
  | { type: 'SET_LIGHTBOX_ASSET'; payload: string | null }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };

const defaultSettings: AIModelSettings = {
  apiKey: '',
  endpoint: 'https://api.openai.com/v1',
  chatModel: 'gpt-4o-mini',
  imageModel: 'gpt-image-1',
  imageMode: 'auto',
  useSharedProvider: false,
  sharedPassword: '',
  sharedProviderUnlockedAt: undefined,
};

const defaultPromptBuilder: PromptBuilderState = {
  selectedPresetId: null,
  selectedTagIds: [],
  selectedCharacterIds: [],
  customSuffix: '',
  presetSearch: '',
  tagSearch: '',
  characterSearch: '',
  activePresetCategory: 'all',
  activeTagGroup: 'all',
  favoritePresetIds: [],
  favoriteTagIds: [],
  favoriteCharacterIds: [],
  recentPresetIds: [],
  recentTagIds: [],
  recentCharacterIds: [],
  isPromptStoreOpen: false,
  carryForwardAssetIds: [],
};

function pushRecent(list: string[], id: string) {
  return [id, ...list.filter((item) => item !== id)].slice(0, 8);
}

function touchWorkspace(workspaces: Workspace[], workspaceId: string) {
  return workspaces.map((workspace) =>
    workspace.id === workspaceId
      ? {
          ...workspace,
          updatedAt: Date.now(),
        }
      : workspace,
  );
}

function sanitizePersistedSettings(settings) {
  return {
    ...settings,
    apiKey: '',
    sharedPassword: '',
  };
}

function migratePersistedState(payload: Partial<AppState>): Partial<AppState> {
  const defaultWorkspace = createDefaultWorkspace();
  const savedWorkspaces = payload.workspaces?.length ? payload.workspaces : [defaultWorkspace];
  const fallbackWorkspaceId =
    payload.activeWorkspaceId && savedWorkspaces.some((workspace) => workspace.id === payload.activeWorkspaceId)
      ? payload.activeWorkspaceId
      : savedWorkspaces[0].id;
  const runtimeSharedEnabled = runtimeConfig.sharedProviderEnabled;
  const persistedSettings: Partial<AIModelSettings> = payload.settings ?? {};

  const migratedMessages = (payload.messages ?? []).map((message) => ({
    ...message,
    workspaceId: message.workspaceId || fallbackWorkspaceId,
  }));

  const migratedAssets = Object.fromEntries(
    Object.entries(payload.assets ?? {}).map(([assetId, asset]) => [
      assetId,
      {
        ...asset,
        workspaceId: asset.workspaceId || fallbackWorkspaceId,
      },
    ]),
  );

  const migratedCharacters = Object.fromEntries(
    Object.entries(payload.characters ?? {}).map(([characterId, character]) => [
      characterId,
      {
        ...character,
        referenceImageUrls: Array.isArray(character.referenceImageUrls) ? character.referenceImageUrls.filter(Boolean) : [],
      },
    ]),
  );

  return {
    ...payload,
    settings: {
      ...defaultSettings,
      ...persistedSettings,
      useSharedProvider: runtimeSharedEnabled ? Boolean(persistedSettings.useSharedProvider) : false,
      sharedPassword: '',
      sharedProviderUnlockedAt: runtimeSharedEnabled && persistedSettings.useSharedProvider ? persistedSettings.sharedProviderUnlockedAt || Date.now() : undefined,
    },
    messages: migratedMessages,
    assets: migratedAssets,
    characters: migratedCharacters,
    workspaces: savedWorkspaces,
    activeWorkspaceId: fallbackWorkspaceId,
  };
}

const initialState: AppState = {
  settings: defaultSettings,
  messages: [],
  assets: {},
  characters: {},
  workspaces: [createDefaultWorkspace()],
  activeWorkspaceId: DEFAULT_WORKSPACE_ID,
  quotedMessageId: null,
  inputMode: 'image',
  locale: 'zh',
  runtimeConfig,
  promptBuilder: defaultPromptBuilder,
  isMobileSidebarOpen: false,
  lightboxAssetId: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
        workspaces: touchWorkspace(state.workspaces, action.payload.workspaceId),
      };
    case 'REMOVE_MESSAGE':
      return { ...state, messages: state.messages.filter((m) => m.id !== action.payload) };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload.id ? { ...m, content: m.content + action.payload.content } : m,
        ),
      };
    case 'MARK_ERROR':
      return {
        ...state,
        messages: state.messages.map((m) => (m.id === action.payload ? { ...m, isError: true } : m)),
      };
    case 'ADD_ASSET':
      return {
        ...state,
        assets: { ...state.assets, [action.payload.id]: action.payload },
        workspaces: touchWorkspace(state.workspaces, action.payload.workspaceId),
      };
    case 'UPSERT_CHARACTER':
      return {
        ...state,
        characters: { ...state.characters, [action.payload.id]: action.payload },
      };
    case 'REMOVE_ASSET': {
      const nextAssets = { ...state.assets };
      delete nextAssets[action.payload];
      return {
        ...state,
        assets: nextAssets,
        messages: state.messages.map((message) => ({
          ...message,
          imageAssets: (message.imageAssets || []).filter((assetId) => assetId !== action.payload),
        })),
        promptBuilder: {
          ...state.promptBuilder,
          carryForwardAssetIds: state.promptBuilder.carryForwardAssetIds.filter((assetId) => assetId !== action.payload),
        },
        lightboxAssetId: state.lightboxAssetId === action.payload ? null : state.lightboxAssetId,
      };
    }
    case 'REMOVE_CHARACTER': {
      const nextCharacters = { ...state.characters };
      delete nextCharacters[action.payload];
      return {
        ...state,
        characters: nextCharacters,
        promptBuilder: {
          ...state.promptBuilder,
          selectedCharacterIds: state.promptBuilder.selectedCharacterIds.filter((id) => id !== action.payload),
          favoriteCharacterIds: state.promptBuilder.favoriteCharacterIds.filter((id) => id !== action.payload),
          recentCharacterIds: state.promptBuilder.recentCharacterIds.filter((id) => id !== action.payload),
        },
      };
    }
    case 'SET_QUOTED_MESSAGE':
      return { ...state, quotedMessageId: action.payload };
    case 'SET_INPUT_MODE':
      return { ...state, inputMode: action.payload };
    case 'SET_LOCALE':
      return { ...state, locale: action.payload };
    case 'SET_PROMPT_BUILDER':
      return { ...state, promptBuilder: { ...state.promptBuilder, ...action.payload } };
    case 'RESET_PROMPT_BUILDER':
      return {
        ...state,
        promptBuilder: {
          ...defaultPromptBuilder,
          favoritePresetIds: state.promptBuilder.favoritePresetIds,
          favoriteTagIds: state.promptBuilder.favoriteTagIds,
          favoriteCharacterIds: state.promptBuilder.favoriteCharacterIds,
          recentPresetIds: state.promptBuilder.recentPresetIds,
          recentTagIds: state.promptBuilder.recentTagIds,
          recentCharacterIds: state.promptBuilder.recentCharacterIds,
          isPromptStoreOpen: state.promptBuilder.isPromptStoreOpen,
          carryForwardAssetIds: state.promptBuilder.carryForwardAssetIds,
        },
      };
    case 'TOGGLE_FAVORITE_PRESET': {
      const exists = state.promptBuilder.favoritePresetIds.includes(action.payload);
      return {
        ...state,
        promptBuilder: {
          ...state.promptBuilder,
          favoritePresetIds: exists
            ? state.promptBuilder.favoritePresetIds.filter((id) => id !== action.payload)
            : [action.payload, ...state.promptBuilder.favoritePresetIds],
        },
      };
    }
    case 'TOGGLE_FAVORITE_TAG': {
      const exists = state.promptBuilder.favoriteTagIds.includes(action.payload);
      return {
        ...state,
        promptBuilder: {
          ...state.promptBuilder,
          favoriteTagIds: exists
            ? state.promptBuilder.favoriteTagIds.filter((id) => id !== action.payload)
            : [action.payload, ...state.promptBuilder.favoriteTagIds],
        },
      };
    }
    case 'TOGGLE_FAVORITE_CHARACTER': {
      const exists = state.promptBuilder.favoriteCharacterIds.includes(action.payload);
      return {
        ...state,
        promptBuilder: {
          ...state.promptBuilder,
          favoriteCharacterIds: exists
            ? state.promptBuilder.favoriteCharacterIds.filter((id) => id !== action.payload)
            : [action.payload, ...state.promptBuilder.favoriteCharacterIds],
        },
      };
    }
    case 'MARK_RECENT_PRESET':
      return {
        ...state,
        promptBuilder: {
          ...state.promptBuilder,
          recentPresetIds: pushRecent(state.promptBuilder.recentPresetIds, action.payload),
        },
      };
    case 'MARK_RECENT_TAG':
      return {
        ...state,
        promptBuilder: {
          ...state.promptBuilder,
          recentTagIds: pushRecent(state.promptBuilder.recentTagIds, action.payload),
        },
      };
    case 'MARK_RECENT_CHARACTER':
      return {
        ...state,
        promptBuilder: {
          ...state.promptBuilder,
          recentCharacterIds: pushRecent(state.promptBuilder.recentCharacterIds, action.payload),
        },
      };
    case 'TOGGLE_CHARACTER_SELECTION': {
      const exists = state.promptBuilder.selectedCharacterIds.includes(action.payload);
      const nextSelectedCharacterIds = exists
        ? state.promptBuilder.selectedCharacterIds.filter((id) => id !== action.payload)
        : [...state.promptBuilder.selectedCharacterIds, action.payload].slice(0, 3);
      return {
        ...state,
        promptBuilder: {
          ...state.promptBuilder,
          selectedCharacterIds: nextSelectedCharacterIds,
          recentCharacterIds: exists ? state.promptBuilder.recentCharacterIds : pushRecent(state.promptBuilder.recentCharacterIds, action.payload),
        },
      };
    }
    case 'TOGGLE_CARRY_FORWARD_ASSET': {
      const exists = state.promptBuilder.carryForwardAssetIds.includes(action.payload);
      return {
        ...state,
        promptBuilder: {
          ...state.promptBuilder,
          carryForwardAssetIds: exists
            ? state.promptBuilder.carryForwardAssetIds.filter((id) => id !== action.payload)
            : pushRecent(state.promptBuilder.carryForwardAssetIds, action.payload),
        },
      };
    }
    case 'UPDATE_ASSET_REFERENCE': {
      const asset = state.assets[action.payload.id];
      if (!asset) return state;
      return {
        ...state,
        assets: {
          ...state.assets,
          [action.payload.id]: {
            ...asset,
            pinned: typeof action.payload.pinned === 'boolean' ? action.payload.pinned : asset.pinned,
            referenceStrength: action.payload.referenceStrength || asset.referenceStrength || 'balanced',
          },
        },
      };
    }
    case 'SET_RUNTIME_CONFIG':
      return { ...state, runtimeConfig: action.payload };
    case 'SET_MOBILE_SIDEBAR_OPEN':
      return { ...state, isMobileSidebarOpen: action.payload };
    case 'CREATE_WORKSPACE': {
      const workspaceCount = state.workspaces.length + 1;
      const nextWorkspace: Workspace = {
        id: `workspace_${crypto.randomUUID()}`,
        name: action.payload?.name?.trim() || `Studio ${String(workspaceCount).padStart(2, '0')}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return {
        ...state,
        workspaces: [nextWorkspace, ...state.workspaces],
        activeWorkspaceId: nextWorkspace.id,
        quotedMessageId: null,
        lightboxAssetId: null,
      };
    }
    case 'SET_ACTIVE_WORKSPACE':
      return { ...state, activeWorkspaceId: action.payload, quotedMessageId: null, lightboxAssetId: null, isMobileSidebarOpen: false };
    case 'RENAME_WORKSPACE':
      return {
        ...state,
        workspaces: state.workspaces.map((workspace) =>
          workspace.id === action.payload.id ? { ...workspace, name: action.payload.name.trim() || workspace.name } : workspace,
        ),
      };
    case 'ARCHIVE_WORKSPACE': {
      if (state.workspaces.length <= 1) return state;
      const nextWorkspaces = state.workspaces.filter((workspace) => workspace.id !== action.payload);
      const nextActiveWorkspaceId = state.activeWorkspaceId === action.payload ? nextWorkspaces[0].id : state.activeWorkspaceId;
      return {
        ...state,
        workspaces: nextWorkspaces,
        activeWorkspaceId: nextActiveWorkspaceId,
        messages: state.messages.filter((message) => message.workspaceId !== action.payload),
        assets: Object.fromEntries(Object.entries(state.assets).filter(([, asset]) => asset.workspaceId !== action.payload)),
        quotedMessageId: null,
        lightboxAssetId: null,
      };
    }
    case 'CLEAR_ACTIVE_WORKSPACE':
      return {
        ...state,
        messages: state.messages.filter((message) => message.workspaceId !== state.activeWorkspaceId),
        assets: Object.fromEntries(Object.entries(state.assets).filter(([, asset]) => asset.workspaceId !== state.activeWorkspaceId)),
        quotedMessageId: null,
        lightboxAssetId: null,
        workspaces: state.workspaces.map((workspace) =>
          workspace.id === state.activeWorkspaceId ? { ...workspace, updatedAt: Date.now() } : workspace,
        ),
      };
    case 'SET_LIGHTBOX_ASSET':
      return { ...state, lightboxAssetId: action.payload };
    case 'LOAD_STATE': {
      const mergedSettings = {
        ...defaultSettings,
        ...(action.payload.settings ?? {}),
        useSharedProvider: runtimeConfig.sharedProviderEnabled
          ? Boolean(action.payload.settings?.useSharedProvider)
          : false,
        sharedPassword: '',
      };
      const mergedPromptBuilder = {
        ...defaultPromptBuilder,
        ...(action.payload.promptBuilder ?? {}),
        isPromptStoreOpen: false,
        carryForwardAssetIds: (action.payload.promptBuilder?.carryForwardAssetIds ?? []).filter((id) => Boolean((action.payload.assets ?? state.assets)?.[id])),
        selectedCharacterIds: (action.payload.promptBuilder?.selectedCharacterIds ?? []).filter((id) => Boolean((action.payload.characters ?? state.characters)?.[id])),
        favoriteCharacterIds: (action.payload.promptBuilder?.favoriteCharacterIds ?? []).filter((id) => Boolean((action.payload.characters ?? state.characters)?.[id])),
        recentCharacterIds: (action.payload.promptBuilder?.recentCharacterIds ?? []).filter((id) => Boolean((action.payload.characters ?? state.characters)?.[id])),
      };
      const savedWorkspaces = action.payload.workspaces?.length ? action.payload.workspaces : [createDefaultWorkspace()];
      const activeWorkspaceId =
        action.payload.activeWorkspaceId && savedWorkspaces.some((workspace) => workspace.id === action.payload.activeWorkspaceId)
          ? action.payload.activeWorkspaceId
          : savedWorkspaces[0].id;
      return {
        ...state,
        ...action.payload,
        settings: mergedSettings,
        promptBuilder: mergedPromptBuilder,
        runtimeConfig,
        characters: action.payload.characters ?? {},
        workspaces: savedWorkspaces,
        activeWorkspaceId,
        isMobileSidebarOpen: false,
        lightboxAssetId: null,
      };
    }
    default:
      return state;
  }
}

const AppStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

const STORAGE_KEY = 'lumina-atelier-state';
const MAX_PERSISTED_ASSETS_PER_WORKSPACE = 12;
const MAX_PERSISTED_DATA_URL_LENGTH = 450000;
const MAX_PERSISTED_MESSAGES_PER_WORKSPACE = 80;

function createPersistableAssets(state: AppState) {
  const workspaceIds = state.workspaces.map((workspace) => workspace.id);
  const persistedEntries = workspaceIds.flatMap((workspaceId) => {
    const workspaceAssets = Object.entries(state.assets)
      .filter(([, asset]) => asset.workspaceId === workspaceId)
      .sort((a, b) => b[1].createdAt - a[1].createdAt)
      .slice(0, MAX_PERSISTED_ASSETS_PER_WORKSPACE)
      .filter(([, asset]) => typeof asset.url === 'string' && asset.url.length <= MAX_PERSISTED_DATA_URL_LENGTH);
    return workspaceAssets;
  });

  return Object.fromEntries(persistedEntries);
}

function createPersistableMessages(state: AppState, persistedAssetIds: Set<string>) {
  const workspaceIds = state.workspaces.map((workspace) => workspace.id);
  return workspaceIds.flatMap((workspaceId) => {
    const workspaceMessages = state.messages
      .filter((message) => message.workspaceId === workspaceId)
      .slice(-MAX_PERSISTED_MESSAGES_PER_WORKSPACE)
      .map((message) => ({
        ...message,
        imageAssets: (message.imageAssets || []).filter((assetId) => persistedAssetIds.has(assetId)),
      }));
    return workspaceMessages;
  });
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'LOAD_STATE', payload: migratePersistedState(parsed) });
      } catch (e) {
        console.error('Failed to load state', e);
      }
    }
  }, []);

  useEffect(() => {
    try {
      const persistedAssets = createPersistableAssets(state);
      const persistedAssetIds = new Set(Object.keys(persistedAssets));
      const persistedMessages = createPersistableMessages(state, persistedAssetIds);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          settings: sanitizePersistedSettings(state.settings),
          locale: state.locale,
          messages: persistedMessages,
          assets: persistedAssets,
          characters: state.characters,
          workspaces: state.workspaces,
          activeWorkspaceId: state.activeWorkspaceId,
          promptBuilder: {
            ...state.promptBuilder,
            isPromptStoreOpen: false,
          },
        }),
      );
    } catch (e) {
      console.error('Failed to save state', e);
    }
  }, [state.settings, state.locale, state.messages, state.assets, state.characters, state.workspaces, state.activeWorkspaceId, state.promptBuilder]);

  return <AppStateContext.Provider value={{ state, dispatch }}>{children}</AppStateContext.Provider>;
}

export function useAppStore() {
  return useContext(AppStateContext);
}
