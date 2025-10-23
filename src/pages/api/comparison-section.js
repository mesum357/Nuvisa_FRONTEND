export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path } = req.query;
    const endpoint = path ? `/comparison-section/${path}` : '/comparison-section/active';
    
    // Call the backend directly
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Origin': 'http://localhost:3000',
        'X-Admin-Proxy': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Handle the backend response structure
    if (data.status === 'success' && data.data) {
      // Check if there's actual data in the results
      if (data.data.results && Object.keys(data.data.results).length > 0) {
        return res.status(200).json(data.data.results);
      } else {
        return res.status(200).json(null);
      }
    }

    return res.status(200).json(data || null);
  } catch (error) {
    console.error('Error fetching comparison section:', error);
    return res.status(500).json({ error: 'Failed to fetch comparison section' });
  }
}
