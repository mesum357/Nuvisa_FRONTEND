import axios from "axios";

// Fetch public countries list from Nuvisa-Admin API
// Expects env NEXT_PUBLIC_ADMIN_API_URL to point to the Admin app base URL
export const fetchCountries = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL;
  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_ADMIN_API_URL environment variable");
  }

  const url = `${baseUrl}/api/countries`;
  const res = await axios.get(url);
  if (res?.data?.success) return res.data.data;
  return [];
};


