import { fetchAdminJson } from '@/utils/adminApiBase';
import { CONTENT_API_HTTP_CACHE } from '@/lib/contentCacheConfig';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { section } = req.query;
    const endpoint = section ? `?section=${encodeURIComponent(section)}` : '';
    const data = await fetchAdminJson(`/api/public/klarna-content${endpoint}`);

    if (!data) {
      throw new Error('No Klarna content from admin panel');
    }

    res.setHeader('Cache-Control', CONTENT_API_HTTP_CACHE);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching klarna content:', error);
    return res.status(500).json({ error: 'Failed to fetch klarna content' });
  }
}
