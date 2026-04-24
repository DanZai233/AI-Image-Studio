import { RuntimeConfig } from '../types';

export const runtimeConfig: RuntimeConfig = {
  appName: import.meta.env.VITE_APP_NAME || 'LUMINA Atelier',
  sharedProviderLabel: import.meta.env.VITE_SHARED_PROVIDER_LABEL || 'Studio Shared Model',
  sharedProviderDescription:
    import.meta.env.VITE_SHARED_PROVIDER_DESCRIPTION ||
    'Use the site preset model without configuring a personal API key.',
  sharedProviderEnabled: import.meta.env.VITE_SHARED_PROVIDER_ENABLED === 'true',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || '',
  imageReferenceEnabled: true,
  imageReferenceHint:
    import.meta.env.VITE_IMAGE_REFERENCE_HINT ||
    'Reference images are forwarded when the upstream image model accepts multimodal prompt content; otherwise the app falls back to contextual text guidance.',
};
