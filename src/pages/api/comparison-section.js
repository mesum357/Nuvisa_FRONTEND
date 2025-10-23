export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path } = req.query;
    const endpoint = path ? `?path=${path}` : '?path=active';
    
    // Call the admin panel API directly
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://nuvisa-admin.vercel.app';
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
