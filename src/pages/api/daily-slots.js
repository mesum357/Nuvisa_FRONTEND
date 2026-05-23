/**
 * Public daily expert slots (proxies admin `/api/daily-slots`).
 */
const ADMIN_API_URL = (
  process.env.NEXT_PUBLIC_ADMIN_API_URL ||
  process.env.ADMIN_API_URL ||
  'http://localhost:3001'
).replace(/\/+$/, '');

export default async function handler(req, res) {
  const base = `${ADMIN_API_URL}/api/daily-slots`;

  if (req.method === 'GET') {
    try {
      const upstream = await fetch(base, { cache: 'no-store' });
      const json = await upstream.json();
      return res.status(upstream.ok ? 200 : upstream.status).json(json);
    } catch (error) {
      return res.status(200).json({
        success: true,
        data: { remaining: 12, defaultSpots: 12 },
      });
    }
  }

  if (req.method === 'POST') {
    const secret = process.env.REVALIDATE_SECRET || '';
    if (!secret) {
      return res.status(503).json({
        success: false,
        error: 'REVALIDATE_SECRET not configured',
      });
    }

    try {
      const upstream = await fetch(base, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidate-secret': secret,
        },
        body: JSON.stringify({}),
        cache: 'no-store',
      });
      const json = await upstream.json();
      return res.status(upstream.ok ? 200 : upstream.status).json(json);
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Decrement failed' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
