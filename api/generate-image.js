import { resolveProvider } from './_shared/provider.js';

export const config = {
  runtime: 'nodejs',
};

function normalizeReferenceImages(referenceImages = []) {
  if (!Array.isArray(referenceImages)) return [];
  return referenceImages
    .filter((item) => item && typeof item.url === 'string' && item.url.startsWith('data:image/'))
    .slice(0, 3)
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
    message.includes('invalid prompt format') ||
    message.includes('unknown parameter')
  );
}

function buildResponsesInput(promptText, multimodalReferences) {
  return [
    {
      role: 'user',
      content: [{ type: 'input_text', text: promptText }, ...multimodalReferences],
    },
  ];
}

function extractImageFromResponsesPayload(data) {
  const output = Array.isArray(data?.output) ? data.output : [];
  for (const item of output) {
    if (!Array.isArray(item?.content)) continue;
    for (const content of item.content) {
      if (content?.type === 'output_text' && typeof content?.text === 'string' && content.text.startsWith('data:image/')) {
        return content.text;
      }
      if (content?.type === 'image_generation_call' && content?.result) {
        return content.result.startsWith('data:image/') ? content.result : `data:image/png;base64,${content.result}`;
      }
    }
  }
  return null;
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

    const requestResponses = async (withImages) => {
      const response = await fetch(`${provider.endpoint}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: provider.imageModel,
          input: buildResponsesInput(promptText, withImages ? multimodalReferences : []),
          modalities: ['image'],
        }),
      });

      const data = await response.json().catch(() => ({}));
      return { response, data };
    };

    let { response, data } = await requestResponses(multimodalReferences.length > 0);

    if (!response.ok && multimodalReferences.length && shouldFallbackToText(response, data)) {
      ({ response, data } = await requestResponses(false));
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || data.error || 'Upstream request failed' });
    }

    const image = extractImageFromResponsesPayload(data);
    if (!image) {
      return res.status(502).json({ error: 'Upstream response did not include an image result' });
    }

    return res.status(200).json({ image });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Image generation failed' });
  }
}
