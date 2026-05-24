import axios from "axios";

// Fetch appointment texts via same-origin API proxy (avoids CORS on production).
export const fetchAppointmentTexts = async () => {
  try {
    const res = await axios.get('/api/appointment-text', {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: false, // Don't send cookies for public endpoint
      timeout: 10000, // 10 second timeout
    });
    
    if (res?.data?.success) return res.data.data;
    return [];
  } catch (error) {
    // Log error for debugging but don't expose sensitive info
    if (error.response) {
      // Server responded with error status
      throw new Error(`API Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network Error: Unable to connect to appointment text API');
    } else {
      // Something else happened
      throw new Error('Failed to fetch appointment texts data');
    }
  }
};
