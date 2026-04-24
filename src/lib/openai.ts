import { AIModelSettings, ImageAsset } from '../types';

interface SharedProviderStatus {
  ok: boolean;
  enabled: boolean;
  message?: string;
}

interface ImageGenerationResponse {
  image: string;
  debug?: string;
}

async function apiRequest<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const debugDetails = Array.isArray(payload.debug)
      ? ` | debug: ${payload.debug.map((item: any) => `${item.mode}:${item.status}${item.error ? `:${item.error}` : ''}`).join(' -> ')}`
      : '';
    throw new Error((payload.error || payload.message || 'Request failed') + debugDetails);
  }

  return {
    ...(payload as T),
    debug:
      response.headers.get('x-lumina-upstream-mode') ||
      (Array.isArray(payload.debug) ? payload.debug.map((item: any) => item.mode).join(' -> ') : undefined),
  } as T;
}

export async function unlockSharedProvider(password: string): Promise<SharedProviderStatus> {
  return apiRequest<SharedProviderStatus>('/api/provider/unlock', { password });
}

export async function fetchImageGeneration(
  settings: AIModelSettings,
  prompt: string,
  referenceImages: ImageAsset[] = [],
  fallbackContext = '',
): Promise<string> {
  const data = await apiRequest<ImageGenerationResponse>('/api/generate-image', {
    settings,
    prompt,
    referenceImages: referenceImages.map((asset) => ({ id: asset.id, url: asset.url, source: asset.source })),
    fallbackContext,
  });

  return data.image;
}

export async function* fetchChatCompletionStream(
  settings: AIModelSettings,
  systemPrompt: string,
  messages: any[],
) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ settings, systemPrompt, messages }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || err.error || `Chat failed: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6).trim();
        if (dataStr === '[DONE]') return;

        try {
          const data = JSON.parse(dataStr);
          const content = data.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch {
          // ignore malformed stream chunks
        }
      }
    }
  }
}
