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
  | { type: 'SET_RUNTIME_CONFIG'; payload: AppState['runtimeConfig'] }
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
};

const initialState: AppState = {
  settings: defaultSettings,
  messages: [],
  assets: {},
  quotedMessageId: null,
  inputMode: 'image',
  locale: 'zh',
  runtimeConfig,
  promptBuilder: defaultPromptBuilder,
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
      return { ...state, promptBuilder: defaultPromptBuilder };
    case 'SET_RUNTIME_CONFIG':
      return { ...state, runtimeConfig: action.payload };
    case 'CLEAR_HISTORY':
      return { ...state, messages: [], assets: {}, quotedMessageId: null };
    case 'LOAD_STATE': {
      const mergedSettings = { ...defaultSettings, ...(action.payload.settings ?? {}) };
      const mergedPromptBuilder = { ...defaultPromptBuilder, ...(action.payload.promptBuilder ?? {}) };
      return {
        ...state,
        ...action.payload,
        settings: mergedSettings,
        promptBuilder: mergedPromptBuilder,
        runtimeConfig,
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
          promptBuilder: state.promptBuilder,
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
