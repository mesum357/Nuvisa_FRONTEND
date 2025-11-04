import axios from "axios";

// Fetch FAQs from admin panel API
export const fetchFAQs = async (category = null) => {
  // Try multiple endpoints in order of preference
  const apiEndpoints = [
    // 1. Admin panel API (if running)
    process.env.NEXT_PUBLIC_ADMIN_API_URL ? `${(process.env.NEXT_PUBLIC_ADMIN_API_URL || '').replace(/\/+$/, '')}/api/public/faqs` : null,
    // 2. Local admin panel (development)
    'http://localhost:3001/api/public/faqs',
    // 3. Frontend's own API route (fallback)
    '/api/faqs',
  ].filter(Boolean);

  const endpoint = category ? `?category=${encodeURIComponent(category)}` : '';

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
      
      if (res?.data?.success) return res.data.data;
    } catch (error) {
      continue;
    }
  }
  
  // Return empty array if all endpoints fail
  return [];
};

