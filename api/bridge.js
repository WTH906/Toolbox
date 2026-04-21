import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const PREFIX = 'bridge:';
const TTL_SECONDS = 60 * 30; // 30 min — just long enough to open the tab

function randomId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // POST: store note content, return short ID
    if (req.method === 'POST') {
      const { name, content, vault, folder, folders, target } = req.body || {};
      if (!name || !content) return res.status(400).json({ error: 'Missing name or content' });

      const id = randomId();
      await redis.set(`${PREFIX}${id}`, {
        name, content, vault: vault || null,
        folder: folder || null, folders: folders || [],
        target: target || 'forge',
      }, { ex: TTL_SECONDS });

      return res.status(200).json({ id });
    }

    // GET: retrieve note content by ID
    if (req.method === 'GET') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'Missing id' });

      const data = await redis.get(`${PREFIX}${id}`);
      if (!data) return res.status(404).json({ error: 'Bridge expired or not found' });

      // Delete after reading — one-time use
      await redis.del(`${PREFIX}${id}`);
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Bridge error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
