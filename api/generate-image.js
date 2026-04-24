import { resolveProvider } from './_shared/provider.js';

export const config = {
  runtime: 'nodejs',
};

function normalizeReferenceImages(referenceImages = []) {
  if (!Array.isArray(referenceImages)) return [];
  return referenceImages
    .filter((item) => item && typeof item.url === 'string' && item.url.startsWith('data:image/'))
    .slice(0, 4)
    .map((item) => ({ type: 'input_image', image_url: item.url }));
}

function shouldFallbackToText(response, data) {
  if (!response || response.ok) return false;
  if (!response.status || response.status >= 500 || response.status === 401 || response.status === 403 || response.status === 429) {
    return false;
  }

  const message = String(data?.error?.message || data?.error || '').toLowerCase();
  return (
    message.includes('input_image') ||
    message.includes('image_url') ||
    message.includes('unsupported image') ||
    message.includes('unsupported multimodal') ||
    message.includes('does not support image') ||
    message.includes('invalid prompt format')
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { settings, prompt, referenceImages = [], fallbackContext = '' } = req.body || {};
    const provider = resolveProvider(settings || {});
    const multimodalReferences = normalizeReferenceImages(referenceImages);
    const promptText = [prompt, fallbackContext].filter(Boolean).join('\n\n');

    const primaryPayload = {
      model: provider.imageModel,
      prompt: multimodalReferences.length
        ? [{ type: 'input_text', text: promptText }, ...multimodalReferences]
        : promptText,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    };

    let response = await fetch(`${provider.endpoint}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(primaryPayload),
    });

    let data = await response.json().catch(() => ({}));

    if (!response.ok && multimodalReferences.length && shouldFallbackToText(response, data)) {
      response = await fetch(`${provider.endpoint}/images/generations`, {
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
      data = await response.json().catch(() => ({}));
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || data.error || 'Image generation failed' });
    }

    return res.status(200).json({ image: `data:image/png;base64,${data.data?.[0]?.b64_json || ''}` });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Image generation failed' });
  }
}
