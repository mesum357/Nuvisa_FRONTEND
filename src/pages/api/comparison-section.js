import { comparisonSectionDefaults } from '@/constants/comparisonSectionDefaults';
import { fetchAdminJson, getAdminApiBases } from '@/utils/adminApiBase';

const hasComparisonPayload = (data) =>
  data &&
  typeof data === 'object' &&
  !data.error &&
  (Array.isArray(data.comparisonRows) ||
    Array.isArray(data.detailSections) ||
    data.title);

async function fetchComparisonFromAdmin(queryString) {
  const path = `/api/comparison-section?${queryString}`;

  for (const base of getAdminApiBases()) {
    const url = `${base}${path}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!response.ok) continue;
      const data = await response.json();
      if (hasComparisonPayload(data)) {
        return data;
      }
    } catch (error) {
      console.warn(`Comparison fetch failed (${url}):`, error?.message || error);
    }
  }

  return null;
}

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

    let data = await fetchComparisonFromAdmin(params.toString());

    if (!data && country) {
      const defaultParams = new URLSearchParams(params);
      defaultParams.set('country', 'Default');
      data = await fetchComparisonFromAdmin(defaultParams.toString());
    }

    if (!data) {
      data = await fetchAdminJson(`/api/comparison-section?path=active&country=Default`);
    }

    if (!data) {
      return res.status(200).json({
        ...comparisonSectionDefaults,
        countryName: 'Default',
        isActive: true,
        source: 'fallback',
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching comparison section:', error);
    return res.status(200).json({
      ...comparisonSectionDefaults,
      countryName: 'Default',
      isActive: true,
      source: 'fallback',
    });
  }
}
