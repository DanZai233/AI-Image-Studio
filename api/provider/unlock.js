import { getPublicRuntimeConfig, resolveProvider } from './_shared/provider.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(getPublicRuntimeConfig());
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body || {};
    const provider = resolveProvider({ useSharedProvider: true, sharedPassword: password || '' });
    return res.status(200).json({ ok: true, enabled: true, source: provider.source });
  } catch (error) {
    const config = getPublicRuntimeConfig();
    return res.status(401).json({ ok: false, enabled: config.sharedProviderEnabled, error: error.message });
  }
}
