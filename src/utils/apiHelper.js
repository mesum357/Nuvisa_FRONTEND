/**
 * API Helper utility for making HTTP requests
 */

/**
 * Fetch data from API with error handling
 * @param {string} endpoint - API endpoint path
 * @returns {Promise<Object>} - Parsed JSON response
 */
export const fetchContent = async (endpoint) => {
  try {
    const bust =
      process.env.NODE_ENV !== 'production'
        ? `?t=${Date.now()}`
        : '';
    const response = await fetch(`/api/public/${endpoint}${bust}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch content');
    }

    if (!Array.isArray(data.data) || data.data.length === 0) {
      throw new Error('No content returned from admin panel');
    }

    return data.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch content');
  }
};

/**
 * Transform array of content items into key-value map
 * @param {Array} data - Array of content items
 * @returns {Object} - Key-value map
 */
export const mapContentArray = (data) => {
  return Object.fromEntries(
    data.map(item => [item.key, item.value])
  );
};

