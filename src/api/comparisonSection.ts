import axios from "axios";

export const getComparisonSection = async () => {
  try {
    const response = await axios.get('/api/comparison-section?path=active');
    return response;
  } catch (error) {
    console.error('Error fetching comparison section:', error);
    throw error;
  }
};
