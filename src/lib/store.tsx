import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, AIModelSettings, Message, ImageAsset } from '../types';

type Action =
  | { type: 'SET_SETTINGS'; payload: AIModelSettings }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'REMOVE_MESSAGE'; payload: string }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; content: string } }
  | { type: 'MARK_ERROR'; payload: string }
  | { type: 'ADD_ASSET'; payload: ImageAsset }
  | { type: 'SET_QUOTED_MESSAGE'; payload: string | null }
  | { type: 'SET_INPUT_MODE'; payload: 'chat' | 'image' }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };

const defaultSettings: AIModelSettings = {
  apiKey: '',
  endpoint: 'https://api.openai.com/v1',
  chatModel: 'gpt-4o',
  imageModel: 'dall-e-3',
};

const initialState: AppState = {
  settings: defaultSettings,
  messages: [],
  assets: {},
  quotedMessageId: null,
  inputMode: 'chat',
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'REMOVE_MESSAGE':
      return { ...state, messages: state.messages.filter(m => m.id !== action.payload) };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload.id ? { ...m, content: m.content + action.payload.content } : m
        ),
      };
    case 'MARK_ERROR':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload ? { ...m, isError: true } : m
        ),
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
    case 'CLEAR_HISTORY':
      return { ...state, messages: [], assets: {} };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const AppStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('ai-image-studio-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      } catch (e) {
        console.error('Failed to load state', e);
      }
    }
  }, []);

  // Save to local storage (ignoring large assets mapping if we want to save space, but let's just save settings and recent for now)
  useEffect(() => {
    // Only persist settings to avoid exceeding local storage quota
    // Or we persist messages but clear massive base64 assets?
    // Let's persist basic stuff and assets since they represent the session
    try {
      localStorage.setItem('ai-image-studio-state', JSON.stringify({
        settings: state.settings,
        // we could optionally persist assets and messages but those can exceed 5mb easily
        // we'll just persist settings to be safe
      }));
    } catch (e) {
      console.error('Failed to save state', e);
    }
  }, [state.settings]);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppStore() {
  return useContext(AppStateContext);
}
