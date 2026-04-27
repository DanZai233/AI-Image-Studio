import { resolveProvider } from './_shared/provider.js';

export const config = {
  runtime: 'nodejs',
};

const REQUEST_TIMEOUT_MS = 30000;

function normalizeReferenceImages(referenceImages = []) {
  if (!Array.isArray(referenceImages)) return [];
  return referenceImages
    .filter((item) => item && typeof item.url === 'string' && item.url.startsWith('data:image/'))
    .slice(0, 3)
    .map((item) => item.url);
}

function shouldFallbackToText(response, data) {
  if (!response || response.ok) return false;
  if (!response.status || response.status === 401 || response.status === 403 || response.status === 429) {
    return false;
  }

  if (response.status >= 500) {
    return true;
  }

  const message = String(data?.error?.message || data?.error || '').toLowerCase();
  return (
    message.includes('input_image') ||
    message.includes('image_url') ||
    message.includes('unsupported image') ||
    message.includes('unsupported multimodal') ||
    message.includes('does not support image') ||
    message.includes('invalid prompt format') ||
    message.includes('unknown parameter') ||
    message.includes('reference image') ||
    message.includes('invalid image') ||
    message.includes('image too large')
  );
}

function extractImageFromImagesPayload(data) {
  const b64 = data?.data?.[0]?.b64_json;
  const url = data?.data?.[0]?.url;
  if (typeof b64 === 'string' && b64) return `data:image/png;base64,${b64}`;
  return typeof url === 'string' && url ? url : null;
}

function getErrorMessage(data, fallback) {
  return data?.error?.message || data?.error || fallback;
}

async function safeFetch(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    return {
      ok: false,
      status: error?.name === 'AbortError' ? 504 : 502,
      json: async () => ({ error: error?.message || 'fetch failed' }),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function safeFetchJson(url, options) {
  const response = await safeFetch(url, options);
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

function buildEditFormData({ promptText, imageModel, imageUrls }) {
  const formData = new FormData();
  formData.append('prompt', promptText);
  formData.append('model', imageModel);

  imageUrls.forEach((dataUrl, index) => {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
    if (!match) return;
    const [, mimeType, base64Data] = match;
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: mimeType });
    const ext = mimeType.split('/')[1] || 'png';
    formData.append('image', blob, `reference-${index + 1}.${ext}`);
  });

  return formData;
}

function buildContextSnapshot({
  summary,
  recentMessages,
  imageCueCount,
  clipped,
}) {
  return {
    summary,
    messageCount: recentMessages.length,
    imageCount: imageCueCount,
    clipped,
    modes: Array.from(new Set(recentMessages.map((message) => message.mode || 'image'))),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { settings, prompt, referenceImages = [], fallbackContext = '', imageMode = 'auto', contextMessages = [] } = req.body || {};
    const provider = resolveProvider(settings || {});
    const imageUrls = normalizeReferenceImages(referenceImages);
    const recentMessages = Array.isArray(contextMessages) ? contextMessages.slice(-6) : [];
    const imageCueCount = recentMessages.reduce((count, message) => count + (Array.isArray(message.imageAssets) ? Math.min(message.imageAssets.length, 4) : 0), 0);
    const contextSnapshot = buildContextSnapshot({
      summary: fallbackContext,
      recentMessages,
      imageCueCount,
      clipped: Boolean(recentMessages.length >= 6 || fallbackContext.length > 900),
    });
    const promptText = [prompt, fallbackContext].filter(Boolean).join('\n\n');

    const requestImagesGeneration = async () => {
      const { response, data } = await safeFetchJson(`${provider.endpoint}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: provider.imageModel,
          prompt: promptText,
          n: 1,
          size: '1024x1024',
          response_format: 'b64_json',
        }),
      });

      return {
        response,
        data,
        image: extractImageFromImagesPayload(data),
        mode: 'images-generations-text',
      };
    };

    const requestImagesEdits = async () => {
      const formData = buildEditFormData({ promptText, imageModel: provider.imageModel, imageUrls });
      const { response, data } = await safeFetchJson(`${provider.endpoint}/images/edits`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: formData,
        // do not set content-type manually; fetch must add multipart/form-data boundary
      });

      return {
        response,
        data,
        image: extractImageFromImagesPayload(data),
        mode: 'images-edits-reference',
      };
    };

    const attempts = [];
    const shouldTryEditFirst = imageUrls.length > 0 && imageMode !== 'generate';

    if (shouldTryEditFirst) {
      const editAttempt = await requestImagesEdits();
      attempts.push({ mode: editAttempt.mode, status: editAttempt.response.status, error: getErrorMessage(editAttempt.data, '') });
      if (editAttempt.response.ok && editAttempt.image) {
        res.setHeader('X-Lumina-Upstream-Mode', editAttempt.mode);
        return res.status(200).json({ image: editAttempt.image, debug: attempts, contextSnapshot });
      }

      if (imageMode === 'edit' && !shouldFallbackToText(editAttempt.response, editAttempt.data)) {
        res.setHeader('X-Lumina-Upstream-Mode', 'failed');
        return res.status(editAttempt.response.status || 502).json({
          error: getErrorMessage(editAttempt.data, 'Reference image edit failed'),
          debug: attempts,
        });
      }
    }

    const generationAttempt = await requestImagesGeneration();
    attempts.push({ mode: generationAttempt.mode, status: generationAttempt.response.status, error: getErrorMessage(generationAttempt.data, '') });
    if (generationAttempt.response.ok && generationAttempt.image) {
      res.setHeader('X-Lumina-Upstream-Mode', generationAttempt.mode);
      return res.status(200).json({ image: generationAttempt.image, debug: attempts, contextSnapshot });
    }

    const lastFailure = generationAttempt;
    res.setHeader('X-Lumina-Upstream-Mode', 'failed');
    return res.status(lastFailure.response.status || 502).json({
      error: getErrorMessage(lastFailure.data, 'Upstream request failed'),
      debug: attempts,
    });
  } catch (error) {
    res.setHeader('X-Lumina-Upstream-Mode', 'exception');
    return res.status(500).json({ error: error.message || 'Image generation failed' });
  }
}
