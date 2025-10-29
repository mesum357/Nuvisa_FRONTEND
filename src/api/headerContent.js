import axios from "axios";

// Fetch header content through the app's internal API route (avoids CORS and duplicates)
export const fetchHeaderContent = async (section = null) => {
  const query = section ? `?section=${encodeURIComponent(section)}` : '';
  try {
    const res = await axios.get(`/api/header-content${query}`, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: false,
      timeout: 7000,
    });
    if (res?.data?.success) return res.data.data;
  } catch (error) {
    console.warn('Failed to fetch header content:', error?.message || error);
  }
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
