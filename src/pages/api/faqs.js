export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { category, faqType } = req.query;
    const query = new URLSearchParams();
    if (category) query.set('category', String(category));
    if (faqType) query.set('faqType', String(faqType));
    const endpoint = query.toString() ? `?${query.toString()}` : '';
    
    // Call the admin panel API directly
    const { getAdminApiBase } = await import('@/utils/adminApiBase');
    const adminUrl = getAdminApiBase();
    const response = await fetch(`${adminUrl}/api/public/faqs${endpoint}`, {
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
    console.error('Error fetching FAQs:', error);
    return res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
}
