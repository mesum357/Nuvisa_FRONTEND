import {
  CONTENT_API_HTTP_CACHE,
} from "@/lib/contentCacheConfig";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { section } = req.query;
    const endpoint = section ? `?section=${section}` : '';
    
    // Call the admin panel API directly
    const { getAdminApiBase } = await import('@/utils/adminApiBase');
    const adminUrl = getAdminApiBase();
    const response = await fetch(`${adminUrl}/api/public/footer-content${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Admin panel responded with status: ${response.status}`);
    }

    const data = await response.json();

    res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching footer content:', error);
    return res.status(500).json({ error: 'Failed to fetch footer content' });
  }
}
