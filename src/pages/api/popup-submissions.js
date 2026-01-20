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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawAdminUrl = process.env.NEXT_PUBLIC_ADMIN_URL;
    const shouldSkipLocalhost = isProduction() && isLocalhost(rawAdminUrl);
    const adminUrl = (rawAdminUrl && !shouldSkipLocalhost) ? rawAdminUrl : 'https://nuvisa-admin.vercel.app';
    
    const response = await fetch(`${adminUrl}/api/popup-submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      throw new Error(`Admin panel responded with status: ${response.status}`);
    }

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in popup-submissions:', error);
    return res.status(500).json({ error: 'Failed to submit data' });
  }
}
