import axios from "axios";

export const getComparisonSection = async (
  country?: string,
  isOccasion?: boolean,
  arrivalDate?: string,
  departureDate?: string
) => {
  try {
    // Only make requests on client side to avoid SSR issues
    if (typeof window === 'undefined') {
      throw new Error('Comparison section API should only be called client-side');
    }

    const params = new URLSearchParams({ path: 'active' });
    if (country) params.set('country', country);
    if (isOccasion) params.set('isOccasion', 'true');
    if (arrivalDate) params.set('arrivalDate', arrivalDate);
    if (departureDate) params.set('departureDate', departureDate);
    const response = await axios.get(`/api/comparison-section?${params.toString()}`);
    return response;
  } catch (error) {
    console.error('Error fetching comparison section:', error);
    throw error;
  }
};
