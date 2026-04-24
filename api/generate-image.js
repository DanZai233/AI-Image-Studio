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

function extractImageFromImagesPayload(data) {
  const b64 = data?.data?.[0]?.b64_json;
  return typeof b64 === 'string' && b64 ? `data:image/png;base64,${b64}` : null;
}

function extractImageFromChatPayload(data) {
  const message = data?.choices?.[0]?.message;
  const content = Array.isArray(message?.content) ? message.content : [];
  for (const item of content) {
    if (item?.type === 'image_url' && item?.image_url?.url) {
      return item.image_url.url;
    }
  }
  return null;
}

function getErrorMessage(data, fallback) {
  return data?.error?.message || data?.error || fallback;
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
      return {
        response,
        data,
        image: extractImageFromResponsesPayload(data),
        mode: withImages ? 'responses-multimodal' : 'responses-text',
      };
    };

    const requestImagesGeneration = async () => {
      const response = await fetch(`${provider.endpoint}/images/generations`, {
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

      const data = await response.json().catch(() => ({}));
      return {
        response,
        data,
        image: extractImageFromImagesPayload(data),
        mode: 'images-generations-text',
      };
    };

    const requestChatCompletionsImage = async () => {
      const response = await fetch(`${provider.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: provider.imageModel,
          messages: [
            {
              role: 'user',
              content: promptText,
            },
          ],
        }),
      });

      const data = await response.json().catch(() => ({}));
      return {
        response,
        data,
        image: extractImageFromChatPayload(data),
        mode: 'chat-completions-image',
      };
    };

    const attempts = [];

    const firstAttempt = await requestResponses(multimodalReferences.length > 0);
    attempts.push({ mode: firstAttempt.mode, status: firstAttempt.response.status, error: getErrorMessage(firstAttempt.data, '') });

    if (firstAttempt.response.ok && firstAttempt.image) {
      res.setHeader('X-Lumina-Upstream-Mode', firstAttempt.mode);
      return res.status(200).json({ image: firstAttempt.image, debug: attempts });
    }

    if (
      firstAttempt.response.ok ||
      !multimodalReferences.length ||
      !shouldFallbackToText(firstAttempt.response, firstAttempt.data)
    ) {
      const secondAttempt = await requestResponses(false);
      attempts.push({ mode: secondAttempt.mode, status: secondAttempt.response.status, error: getErrorMessage(secondAttempt.data, '') });
      if (secondAttempt.response.ok && secondAttempt.image) {
        res.setHeader('X-Lumina-Upstream-Mode', secondAttempt.mode);
        return res.status(200).json({ image: secondAttempt.image, debug: attempts });
      }
    }

    const imageGenerationAttempt = await requestImagesGeneration();
    attempts.push({ mode: imageGenerationAttempt.mode, status: imageGenerationAttempt.response.status, error: getErrorMessage(imageGenerationAttempt.data, '') });
    if (imageGenerationAttempt.response.ok && imageGenerationAttempt.image) {
      res.setHeader('X-Lumina-Upstream-Mode', imageGenerationAttempt.mode);
      return res.status(200).json({ image: imageGenerationAttempt.image, debug: attempts });
    }

    const chatAttempt = await requestChatCompletionsImage();
    attempts.push({ mode: chatAttempt.mode, status: chatAttempt.response.status, error: getErrorMessage(chatAttempt.data, '') });
    if (chatAttempt.response.ok && chatAttempt.image) {
      res.setHeader('X-Lumina-Upstream-Mode', chatAttempt.mode);
      return res.status(200).json({ image: chatAttempt.image, debug: attempts });
    }

    const lastFailure = [chatAttempt, imageGenerationAttempt, firstAttempt].find((attempt) => !attempt.response.ok || !attempt.image) || firstAttempt;
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
