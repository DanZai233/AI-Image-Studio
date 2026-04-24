import { resolveProvider } from './_shared/provider.js';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { settings, prompt } = req.body || {};
    const provider = resolveProvider(settings || {});

    const response = await fetch(`${provider.endpoint}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.imageModel,
        prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json',
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || data.error || 'Image generation failed' });
    }

    return res.status(200).json({ image: `data:image/png;base64,${data.data?.[0]?.b64_json || ''}` });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Image generation failed' });
  }
}
