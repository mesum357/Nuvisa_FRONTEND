import { getAdminApiBase } from "@/utils/adminApiBase";
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

    const countryParam = country ? `&country=${encodeURIComponent(country)}` : '';
    const occasionParam = isOccasion ? '&isOccasion=true' : '';
    const arrivalDateParam = arrivalDate ? `&arrivalDate=${encodeURIComponent(arrivalDate)}` : '';
    const departureDateParam = departureDate ? `&departureDate=${encodeURIComponent(departureDate)}` : '';
    const response = await axios.get(`${getAdminApiBase()}/api/comparison-section?path=active${countryParam}${occasionParam}${arrivalDateParam}${departureDateParam}`);
    return response;
  } catch (error) {
    console.error('Error fetching comparison section:', error);
    throw error;
  }
};
