import { resolveProvider } from './_shared/provider.js';

export const config = {
  runtime: 'nodejs',
  maxDuration: 300,
};

const REQUEST_TIMEOUT_MS = 300000;

async function safeFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    const message = error?.name === 'AbortError'
      ? `Upstream chat request timed out after ${REQUEST_TIMEOUT_MS}ms`
      : error?.message || 'fetch failed';
    return {
      ok: false,
      status: error?.name === 'AbortError' ? 504 : 502,
      body: null,
      json: async () => ({ error: message }),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { settings, systemPrompt, messages } = req.body || {};
    const provider = resolveProvider(settings || {});

    const upstream = await safeFetch(`${provider.endpoint}/chat/completions`, {
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
