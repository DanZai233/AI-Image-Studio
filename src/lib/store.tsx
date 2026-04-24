import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, AIModelSettings, ImageAsset, InputMode, Locale, Message, PromptBuilderState } from '../types';
import { runtimeConfig } from './config';

type Action =
  | { type: 'SET_SETTINGS'; payload: Partial<AIModelSettings> }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'REMOVE_MESSAGE'; payload: string }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; content: string } }
  | { type: 'MARK_ERROR'; payload: string }
  | { type: 'ADD_ASSET'; payload: ImageAsset }
  | { type: 'SET_QUOTED_MESSAGE'; payload: string | null }
  | { type: 'SET_INPUT_MODE'; payload: InputMode }
  | { type: 'SET_LOCALE'; payload: Locale }
  | { type: 'SET_PROMPT_BUILDER'; payload: Partial<PromptBuilderState> }
  | { type: 'RESET_PROMPT_BUILDER' }
  | { type: 'TOGGLE_FAVORITE_PRESET'; payload: string }
  | { type: 'TOGGLE_FAVORITE_TAG'; payload: string }
  | { type: 'MARK_RECENT_PRESET'; payload: string }
  | { type: 'MARK_RECENT_TAG'; payload: string }
  | { type: 'SET_RUNTIME_CONFIG'; payload: AppState['runtimeConfig'] }
  | { type: 'SET_MOBILE_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };

const defaultSettings: AIModelSettings = {
  apiKey: '',
  endpoint: 'https://api.openai.com/v1',
  chatModel: 'gpt-4o-mini',
  imageModel: 'gpt-image-1',
  useSharedProvider: runtimeConfig.sharedProviderEnabled,
  sharedPassword: '',
};

const defaultPromptBuilder: PromptBuilderState = {
  selectedPresetId: null,
  selectedTagIds: [],
  customSuffix: '',
  presetSearch: '',
  tagSearch: '',
  activePresetCategory: 'all',
  activeTagGroup: 'all',
  favoritePresetIds: [],
  favoriteTagIds: [],
  recentPresetIds: [],
  recentTagIds: [],
  isPromptStoreOpen: false,
};

function pushRecent(list: string[], id: string) {
  return [id, ...list.filter((item) => item !== id)].slice(0, 8);
}

const initialState: AppState = {
  settings: defaultSettings,
  messages: [],
  assets: {},
  quotedMessageId: null,
  inputMode: 'image',
  locale: 'zh',
  runtimeConfig,
  promptBuilder: defaultPromptBuilder,
  isMobileSidebarOpen: false,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
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
      };
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
          recentPresetIds: state.promptBuilder.recentPresetIds,
          recentTagIds: state.promptBuilder.recentTagIds,
          isPromptStoreOpen: state.promptBuilder.isPromptStoreOpen,
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
    case 'SET_RUNTIME_CONFIG':
      return { ...state, runtimeConfig: action.payload };
    case 'SET_MOBILE_SIDEBAR_OPEN':
      return { ...state, isMobileSidebarOpen: action.payload };
    case 'CLEAR_HISTORY':
      return { ...state, messages: [], assets: {}, quotedMessageId: null, isMobileSidebarOpen: false };
    case 'LOAD_STATE': {
      const mergedSettings = { ...defaultSettings, ...(action.payload.settings ?? {}) };
      const mergedPromptBuilder = {
        ...defaultPromptBuilder,
        ...(action.payload.promptBuilder ?? {}),
        isPromptStoreOpen: false,
      };
      return {
        ...state,
        ...action.payload,
        settings: mergedSettings,
        promptBuilder: mergedPromptBuilder,
        runtimeConfig,
        isMobileSidebarOpen: false,
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

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      } catch (e) {
        console.error('Failed to load state', e);
      }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          settings: state.settings,
          locale: state.locale,
          promptBuilder: {
            ...state.promptBuilder,
            isPromptStoreOpen: false,
          },
        }),
      );
    } catch (e) {
      console.error('Failed to save state', e);
    }
  }, [state.settings, state.locale, state.promptBuilder]);

  return <AppStateContext.Provider value={{ state, dispatch }}>{children}</AppStateContext.Provider>;
}

export function useAppStore() {
  return useContext(AppStateContext);
}
