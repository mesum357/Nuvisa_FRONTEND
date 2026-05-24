import { getHeaderCacheStore } from "@/lib/contentApiCache";
import {
  CONTENT_API_CACHE_TTL_MS,
  CONTENT_API_HTTP_CACHE,
} from "@/lib/contentCacheConfig";

const DEFAULT_TTL_MS = CONTENT_API_CACHE_TTL_MS;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { section } = req.query;
    const sectionKey = section || '__all__';
    const now = Date.now();

    // Serve from cache if fresh
    const cacheStore = getHeaderCacheStore();
    const cached = cacheStore.get(sectionKey);
    if (cached && now - cached.timestamp < (process.env.HEADER_CONTENT_TTL_MS ? Number(process.env.HEADER_CONTENT_TTL_MS) : DEFAULT_TTL_MS)) {
      res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
      return res.status(200).json(cached.data);
    }

    const endpoint = section ? `?section=${encodeURIComponent(section)}` : '';

    // Server-to-server call to admin API (no CORS from browser)
    const { getAdminApiBase } = await import('@/utils/adminApiBase');
    const adminUrl = getAdminApiBase();
    const response = await fetch(`${adminUrl}/api/public/header-content${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add a timeout using AbortController
      signal: (() => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        // Will be cleared once fetch resolves
        // @ts-ignore - res.once not typed here; safe in Next runtime
        res.once && res.once('finish', () => clearTimeout(timeout));
        return controller.signal;
      })(),
    });

    if (!response.ok) {
      throw new Error(`Admin panel responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Cache and return
    cacheStore.set(sectionKey, { data, timestamp: now });
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching header content:', error);
    return res.status(500).json({ error: 'Failed to fetch header content' });
  }
}
