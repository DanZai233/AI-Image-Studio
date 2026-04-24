const OPENAI_DEFAULT_ENDPOINT = 'https://api.openai.com/v1';

function resolveSetting(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function getSharedConfig() {
  const sharedPassword = process.env.SHARED_PROVIDER_PASSWORD || '';
  const sharedApiKey = process.env.SHARED_PROVIDER_API_KEY || '';
  const sharedEndpoint = resolveSetting(process.env.SHARED_PROVIDER_ENDPOINT, OPENAI_DEFAULT_ENDPOINT);
  const sharedChatModel = resolveSetting(process.env.SHARED_PROVIDER_CHAT_MODEL, 'gpt-4o-mini');
  const sharedImageModel = resolveSetting(process.env.SHARED_PROVIDER_IMAGE_MODEL, 'gpt-image-1');
  const enabled = Boolean(sharedPassword && sharedApiKey && sharedEndpoint);

  return {
    enabled,
    sharedPassword,
    sharedApiKey,
    sharedEndpoint,
    sharedChatModel,
    sharedImageModel,
  };
}

function validateUserSettings(settings = {}) {
  const endpoint = resolveSetting(settings.endpoint, OPENAI_DEFAULT_ENDPOINT).replace(/\/+$/, '');
  return {
    endpoint,
    apiKey: resolveSetting(settings.apiKey),
    chatModel: resolveSetting(settings.chatModel, 'gpt-4o-mini'),
    imageModel: resolveSetting(settings.imageModel, 'gpt-image-1'),
    useSharedProvider: Boolean(settings.useSharedProvider),
    sharedPassword: resolveSetting(settings.sharedPassword),
  };
}

export function resolveProvider(settings = {}) {
  const shared = getSharedConfig();
  const normalized = validateUserSettings(settings);

  if (normalized.useSharedProvider) {
    if (!shared.enabled) {
      throw new Error('Shared provider is not configured on the server.');
    }

    if (!normalized.sharedPassword || normalized.sharedPassword !== shared.sharedPassword) {
      throw new Error('Invalid shared provider password.');
    }

    return {
      endpoint: shared.sharedEndpoint.replace(/\/+$/, ''),
      apiKey: shared.sharedApiKey,
      chatModel: shared.sharedChatModel,
      imageModel: shared.sharedImageModel,
      source: 'shared',
    };
  }

  if (!normalized.apiKey) {
    throw new Error('Missing personal API key.');
  }

  return {
    endpoint: normalized.endpoint,
    apiKey: normalized.apiKey,
    chatModel: normalized.chatModel,
    imageModel: normalized.imageModel,
    source: 'personal',
  };
}

export function getPublicRuntimeConfig() {
  const shared = getSharedConfig();
  return {
    appName: process.env.VITE_APP_NAME || 'LUMINA Atelier',
    sharedProviderLabel: process.env.VITE_SHARED_PROVIDER_LABEL || 'Studio Shared Model',
    sharedProviderDescription:
      process.env.VITE_SHARED_PROVIDER_DESCRIPTION ||
      'Use the site preset model without configuring a personal API key.',
    sharedProviderEnabled: shared.enabled,
    supportEmail: process.env.VITE_SUPPORT_EMAIL || '',
  };
}
