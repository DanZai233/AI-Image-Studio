export type Locale = 'zh' | 'en';
export type InputMode = 'chat' | 'image';
export type ImageModeStrategy = 'auto' | 'edit' | 'generate';
export type VisualStyleKey =
  | 'cinematic'
  | 'editorial'
  | 'anime'
  | 'photography'
  | 'conceptArt'
  | 'watercolor'
  | 'poster'
  | 'product'
  | 'interior'
  | 'fashion';

export type PromptPresetCategory = 'portrait' | 'cinematic' | 'illustration' | 'product' | 'space';
export type PromptTagGroup = 'quality' | 'lighting' | 'composition' | 'style' | 'camera' | 'mood' | 'material';

export interface AIModelSettings {
  apiKey: string;
  endpoint: string;
  chatModel: string;
  imageModel: string;
  imageMode: ImageModeStrategy;
  useSharedProvider: boolean;
  sharedPassword: string;
  sharedProviderUnlockedAt?: number;
}

export interface RuntimeConfig {
  appName: string;
  sharedProviderLabel: string;
  sharedProviderDescription: string;
  sharedProviderEnabled: boolean;
  supportEmail: string;
  imageReferenceEnabled: boolean;
  imageReferenceHint: string;
}

export interface ContextSnapshot {
  summary: string;
  messageCount: number;
  imageCount: number;
  clipped: boolean;
  modes: Array<'chat' | 'image'>;
}

export interface ImageAsset {
  id: string;
  name: string;
  url: string;
  source: 'upload' | 'generation';
  createdAt: number;
  prompt?: string;
  workspaceId: string;
  pinned?: boolean;
  referenceStrength?: 'subtle' | 'balanced' | 'strong';
}

export interface PromptPreset {
  id: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  category: PromptPresetCategory;
  prompt: Record<Locale, string>;
  tags: string[];
  recommendedNegativePrompt?: string;
  featured?: boolean;
}

export interface CharacterProfile {
  id: string;
  name: string;
  title?: string;
  description: Record<Locale, string>;
  visualPrompt: Record<Locale, string>;
  stylePrompt?: Record<Locale, string>;
  referenceImageUrls: string[];
  coverImageUrl?: string;
  tags?: string[];
  featured?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TagDefinition {
  id: string;
  label: Record<Locale, string>;
  description: Record<Locale, string>;
  value: string;
  group: PromptTagGroup;
  featured?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: InputMode;
  imageAssets?: string[];
  quotedMessageId?: string;
  timestamp: number;
  isError?: boolean;
  workspaceId: string;
  metadata?: {
    presetId?: string;
    tags?: string[];
    characterIds?: string[];
  };
}

export interface Workspace {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface PromptBuilderState {
  selectedPresetId: string | null;
  selectedTagIds: string[];
  selectedCharacterIds: string[];
  customSuffix: string;
  presetSearch: string;
  tagSearch: string;
  characterSearch: string;
  activePresetCategory: PromptPresetCategory | 'all';
  activeTagGroup: PromptTagGroup | 'all';
  favoritePresetIds: string[];
  favoriteTagIds: string[];
  favoriteCharacterIds: string[];
  recentPresetIds: string[];
  recentTagIds: string[];
  recentCharacterIds: string[];
  isPromptStoreOpen: boolean;
  carryForwardAssetIds: string[];
}

export type AppState = {
  settings: AIModelSettings;
  messages: Message[];
  assets: Record<string, ImageAsset>;
  characters: Record<string, CharacterProfile>;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  quotedMessageId: string | null;
  inputMode: InputMode;
  locale: Locale;
  runtimeConfig: RuntimeConfig;
  promptBuilder: PromptBuilderState;
  isMobileSidebarOpen: boolean;
  lightboxAssetId: string | null;
};
