import axios from "axios";

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

// Fetch FAQs from admin panel API
export const fetchFAQs = async (filters = null) => {
  // Try multiple endpoints in order of preference
  const adminApiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL;
  // Only skip localhost URLs in production (allow them in development)
  const shouldSkipLocalhost = isProduction() && isLocalhost(adminApiUrl);
  const apiEndpoints = [
    // 1. Same-origin proxy (reliable; avoids CORS / client timeouts)
    '/api/faqs',
    // 2. Admin panel API (direct)
    adminApiUrl && !shouldSkipLocalhost ? `${adminApiUrl.replace(/\/+$/, '')}/api/public/faqs` : null,
  ].filter(Boolean);

  const normalizedFilters = typeof filters === 'string'
    ? { category: filters }
    : (filters || {});

  const query = new URLSearchParams();
  if (normalizedFilters.category) {
    query.set('category', normalizedFilters.category);
  }
  if (normalizedFilters.faqType) {
    query.set('faqType', normalizedFilters.faqType);
  }
  if (normalizedFilters.isFeatured) {
    query.set('isFeatured', String(normalizedFilters.isFeatured));
  }

  const endpoint = query.toString() ? `?${query.toString()}` : '';

  for (const baseUrl of apiEndpoints) {
    try {
      const cleanBaseUrl = baseUrl.replace(/\/$/, '');
      const url = `${cleanBaseUrl}${endpoint}`;
      
      const res = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: false, // Don't send cookies for public endpoint
        timeout: 5000, // 5 second timeout
      });
      if (res?.data?.success && Array.isArray(res.data.data)) return res.data.data;
      if (Array.isArray(res?.data?.data)) return res.data.data;
      if (Array.isArray(res?.data)) return res.data;
    } catch (error) {
      continue;
    }
  }
  
  // Return empty array if all endpoints fail
  return [];
};

