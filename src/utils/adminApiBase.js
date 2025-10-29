// Returns the admin API base URL without any trailing slashes
export const getAdminApiBase = () => {
	const raw = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001';
	return raw.replace(/\/+$/, '');
};


