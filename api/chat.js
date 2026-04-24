import { resolveProvider } from './_shared/provider.js';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { settings, systemPrompt, messages } = req.body || {};
    const provider = resolveProvider(settings || {});

    const upstream = await fetch(`${provider.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.chatModel,
        stream: true,
        messages: [{ role: 'system', content: systemPrompt }, ...(messages || [])],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const data = await upstream.json().catch(() => ({}));
      return res.status(upstream.status || 500).json({ error: data.error?.message || data.error || 'Chat request failed' });
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const reader = upstream.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }

    res.end();
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Chat request failed' });
  }
}
