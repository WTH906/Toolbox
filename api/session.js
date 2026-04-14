import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const PREFIXES = { annotator: 'mda:', forge: 'forge:', default: 'mda:' };
const MAX_SIZE = 5 * 1024 * 1024;
const TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days

function getPrefix(app) {
  return PREFIXES[app] || PREFIXES.default;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = req.query.id?.trim().toLowerCase();
  const app = req.query.app || 'annotator';
  const prefix = getPrefix(app);

  try {
    if (req.method === 'GET') {
      if (!id) return res.status(400).json({ error: 'Missing session id' });
      const data = await redis.get(`${prefix}${id}`);
      if (!data) return res.status(404).json({ error: 'Session not found' });
      return res.status(200).json(data);
    }

    if (req.method === 'PUT') {
      const body = req.body;
      if (!body?.id) return res.status(400).json({ error: 'Missing session id in body' });

      const key = `${prefix}${body.id.trim().toLowerCase()}`;
      const payload = { savedAt: new Date().toISOString() };

      if (app === 'forge') {
        payload.docs = body.docs || [];
        payload.templates = body.templates || [];
      } else {
        if (body.notes) {
          payload.notes = body.notes;
        } else {
          payload.markdown = body.markdown || '';
          payload.fileName = body.fileName || null;
          payload.annotations = body.annotations || [];
          payload.sourceVault = body.sourceVault || null;
          payload.sourceFolder = body.sourceFolder || null;
        }
      }

      const size = JSON.stringify(payload).length;
      if (size > MAX_SIZE) return res.status(413).json({ error: 'Session data too large' });

      await redis.set(key, payload, { ex: TTL_SECONDS });
      return res.status(200).json({ ok: true, savedAt: payload.savedAt });
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'Missing session id' });
      await redis.del(`${prefix}${id}`);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Redis error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
