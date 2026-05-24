import { getAdminApiBase } from '@/utils/adminApiBase';

export default async function handler(req, res) {
	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const adminUrl = getAdminApiBase();
		const response = await fetch(`${adminUrl}/api/appointment-text`, {
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
		console.error('Error fetching appointment text:', error);
		return res.status(500).json({ success: false, error: 'Failed to fetch appointment text' });
	}
}
