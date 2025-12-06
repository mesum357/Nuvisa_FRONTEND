// Helper to check if URL is localhost
const isLocalhost = (url) => {
	if (!url) return false;
	try {
		const urlObj = new URL(url);
		return urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1' || urlObj.hostname.startsWith('192.168.') || urlObj.hostname.startsWith('10.') || urlObj.hostname.startsWith('172.');
	} catch {
		return url.includes('localhost') || url.includes('127.0.0.1');
	}
};

// Helper to check if we're in production
const isProduction = () => {
	return process.env.NODE_ENV === 'production' && 
	       process.env.NEXT_PUBLIC_NODE_ENV !== 'development';
};

// Returns the admin API base URL without any trailing slashes
export const getAdminApiBase = () => {
	const raw = process.env.NEXT_PUBLIC_ADMIN_API_URL;
	if (!raw) {
		// Fallback to production admin URL if env var is not set
		return 'https://nuvisa-admin.vercel.app';
	}
	
	// Only block localhost URLs in production (allow them in development)
	if (isProduction() && isLocalhost(raw)) {
		return 'https://nuvisa-admin.vercel.app';
	}
	
	return raw.replace(/\/+$/, '');
};


