import axios from "axios";

export const getComparisonSection = async () => {
  try {
    // Only make requests on client side to avoid SSR issues
    if (typeof window === 'undefined') {
      throw new Error('Comparison section API should only be called client-side');
    }
    
    // Construct the URL using window.location to avoid localhost fallback
    const baseUrl = window.location.origin;
    const response = await axios.get(`${baseUrl}/api/comparison-section?path=active`);
    return response;
  } catch (error) {
    console.error('Error fetching comparison section:', error);
    throw error;
  }
};
