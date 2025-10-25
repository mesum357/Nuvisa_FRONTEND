import axios from "axios";

// Fetch header content from admin panel API
export const fetchHeaderContent = async (section = null) => {
  // Try multiple endpoints in order of preference
  const apiEndpoints = [
    // 1. Admin panel API (if running)
    process.env.NEXT_PUBLIC_ADMIN_API_URL ? `${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/public/header-content` : null,
    // 2. Local admin panel (development)
    'http://localhost:3001/api/public/header-content',
    // 3. Frontend's own API route (fallback)
    '/api/header-content',
  ].filter(Boolean);

  const endpoint = section ? `?section=${section}` : '';

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
      console.warn(`Failed to fetch from ${baseUrl}:`, error.message);
      continue;
    }
  }
  
  // Return empty array if all endpoints fail
  console.warn('All header content API endpoints failed, using fallback');
  return [];
};

// Helper function to get content by key
export const getHeaderContentByKey = (contentArray, key) => {
  const item = contentArray.find(item => item.key === key);
  return item ? item.value : '';
};

// Helper function to get content by section
export const getHeaderContentBySection = (contentArray, section) => {
  return contentArray.filter(item => item.section === section);
};
