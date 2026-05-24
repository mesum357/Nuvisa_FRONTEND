/**
 * API Helper utility for making HTTP requests
 */

import { getAdminApiBase } from '@/utils/adminApiBase';

/**
 * Fetch data from API with error handling
 * @param {string} endpoint - API endpoint path
 * @returns {Promise<Object>} - Parsed JSON response
 */
export const fetchContent = async (endpoint) => {
  try {
    const API_BASE_URL = getAdminApiBase();
    const response = await fetch(`${API_BASE_URL}/api/public/${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch content');
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

