// Helper to check if URL is localhost
const isLocalhost = (url) => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1' || urlObj.hostname.startsWith('192.168.') || urlObj.hostname.startsWith('10.') || urlObj.hostname.startsWith('172.');
  } catch {
    return url.includes('localhost') || url.includes('127.0.0.1');
  }
};

// Helper to check if we're in production
const isProduction = () => {
  return process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PUBLIC_NODE_ENV !== 'development';
};

const DEFAULT_EXPERT_SECTION = {
  id: 'default-expert-section',
  isActive: true,
  titleLine1: 'Unlock Your Visa Success with',
  titleLine2: 'Unlimited Access to a',
  titleLine3: 'Accountability Expert',
  originalPrice: '£35/ Month',
  offerPrice: 'Free',
  offerDescription: 'with next 100 visa applications!',
  expertImage: '/image/expert.png',
  defaultSpotsLeft: 12,
};

const adminBaseUrls = () => {
  const fromEnv = [
    process.env.NEXT_PUBLIC_ADMIN_API_URL,
    process.env.NEXT_PUBLIC_ADMIN_URL,
    process.env.ADMIN_PUBLIC_URL,
  ]
    .filter(Boolean)
    .map((url) => String(url).replace(/\/+$/, ''))
    .filter((url) => !(isProduction() && isLocalhost(url)));

  return [
    ...new Set([
      ...fromEnv,
      'https://nuvisa-admin.vercel.app',
      'https://nuvisa-admin-updated.vercel.app',
    ]),
  ];
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { path } = req.query;
  const params = new URLSearchParams();
  params.append('path', path || 'active');
  const endpoint = `?${params.toString()}`;

  let lastError = '';

  for (const adminUrl of adminBaseUrls()) {
    const url = `${adminUrl}/api/expert-section${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        lastError = `${url} responded with status ${response.status}`;
        continue;
      }

      const data = await response.json();
      return res.status(200).json(data?.data || data);
    } catch (error) {
      lastError = `${url} failed: ${error?.message || 'Network error'}`;
    }
  }

  console.warn('Falling back to default expert section:', lastError);
  res.setHeader('Cache-Control', 'no-store, must-revalidate');
  return res.status(200).json(DEFAULT_EXPERT_SECTION);
}
