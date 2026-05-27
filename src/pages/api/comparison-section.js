import { getAdminApiBase } from '@/utils/adminApiBase';

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
    const endpoint = `?${params.toString()}`;

    const adminUrl = getAdminApiBase();
    const response = await fetch(`${adminUrl}/api/comparison-section${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Admin panel responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Return the data directly from admin panel
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching comparison section:', error);
    return res.status(500).json({ error: 'Failed to fetch comparison section' });
  }
}
