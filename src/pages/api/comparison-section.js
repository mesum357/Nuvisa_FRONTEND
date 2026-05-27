import { fetchAdminJson } from '@/utils/adminApiBase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path, country, isOccasion, arrivalDate, departureDate } = req.query;
    const params = new URLSearchParams();
    params.append('path', path || 'active');
    if (country) params.append('country', country);
    if (isOccasion !== undefined) params.append('isOccasion', String(isOccasion));
    if (arrivalDate) params.append('arrivalDate', String(arrivalDate));
    if (departureDate) params.append('departureDate', String(departureDate));

    const data = await fetchAdminJson(`/api/comparison-section?${params.toString()}`);

    if (!data) {
      throw new Error('No comparison section data from admin panel');
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching comparison section:', error);
    return res.status(500).json({ error: 'Failed to fetch comparison section' });
  }
}
