import { getAdminApiBase } from '@/utils/adminApiBase';

export default async function handler(req, res) {
	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const slugParts = req.query.slug;
	const slug = Array.isArray(slugParts) ? slugParts.join('/') : slugParts || '';

	if (!slug) {
		return res.status(400).json({ success: false, error: 'Missing path' });
	}

	try {
		const adminUrl = getAdminApiBase();
		const { slug: _slug, ...rest } = req.query;
		const params = new URLSearchParams();
		Object.entries(rest).forEach(([key, value]) => {
			if (value !== undefined) {
				params.append(key, Array.isArray(value) ? value.join(',') : String(value));
			}
		});
		const qs = params.toString();
		const url = `${adminUrl}/api/public/${slug}${qs ? `?${qs}` : ''}`;

		const response = await fetch(url, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		});

		if (!response.ok) {
			return res.status(response.status).json({
				success: false,
				error: `Admin panel responded with status: ${response.status}`,
			});
		}

		const data = await response.json();
		return res.status(200).json(data);
	} catch (error) {
		console.error(`Error fetching public/${slug}:`, error);
		return res.status(500).json({ success: false, error: 'Failed to fetch content' });
	}
}
