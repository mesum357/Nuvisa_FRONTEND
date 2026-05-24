// Helper to check if URL is localhost
const isLocalhost = (url) => {
	if (!url) return false;
	try {
		const urlObj = new URL(url);
		return (
			urlObj.hostname === 'localhost' ||
			urlObj.hostname === '127.0.0.1' ||
			urlObj.hostname.startsWith('192.168.') ||
			urlObj.hostname.startsWith('10.') ||
			urlObj.hostname.startsWith('172.')
		);
	} catch {
		return url.includes('localhost') || url.includes('127.0.0.1');
	}
};

/** True when running a production build outside local dev. */
const isProductionBuild = () => {
	return (
		process.env.NODE_ENV === 'production' &&
		process.env.NEXT_PUBLIC_NODE_ENV !== 'development'
	);
};

/** True in the browser on a deployed host (Render, Vercel, etc.). */
export const isDeployedBrowser = () => {
	if (typeof window === 'undefined') return false;
	const host = window.location.hostname;
	return host !== 'localhost' && host !== '127.0.0.1';
};

/** Block localhost upstream URLs on production builds and deployed browsers. */
export const shouldBlockLocalhostUrls = () => {
	return isProductionBuild() || isDeployedBrowser();
};

// Returns the admin API base URL without any trailing slashes
export const getAdminApiBase = () => {
	const raw = process.env.NEXT_PUBLIC_ADMIN_API_URL;
	if (!raw) {
		return 'https://nuvisa-admin.vercel.app';
	}

	if (shouldBlockLocalhostUrls() && isLocalhost(raw)) {
		return 'https://nuvisa-admin.vercel.app';
	}

	return raw.replace(/\/+$/, '');
};

/** NestJS backend base URL for browser-side API calls. */
export const getPublicApiBase = () => {
	const raw = process.env.NEXT_PUBLIC_API_URL;
	if (!raw) return '';

	// Only strip localhost in the browser on a deployed site (not on the Node server).
	if (isDeployedBrowser() && isLocalhost(raw)) {
		return '';
	}

	return raw.replace(/\/+$/, '');
};

/** NestJS backend URL for Next.js API route proxies (server-only env preferred). */
export const getBackendApiBase = () => {
	const serverUrl = process.env.BACKEND_API_URL || process.env.API_URL;
	if (serverUrl) {
		return String(serverUrl).replace(/\/+$/, '');
	}

	const raw = process.env.NEXT_PUBLIC_API_URL;
	if (!raw) return '';

	if (process.env.NODE_ENV === 'production' && isLocalhost(raw)) {
		return '';
	}

	return raw.replace(/\/+$/, '');
};

const STRIPE_PROXY_PREFIX = '/api/stripe/';

/** Resolve payment endpoint — same-origin proxy when public API base is unavailable. */
export const resolvePaymentApiUrl = (endpoint) => {
	const base = getPublicApiBase();
	if (base) {
		return `${base}${endpoint}`;
	}

	if (endpoint.startsWith('/stripe_payment/')) {
		return `${STRIPE_PROXY_PREFIX}${endpoint.slice('/stripe_payment/'.length)}`;
	}

	return endpoint;
};

/** Resolve country/appointment image paths from admin API or local public assets. */
export const resolveCountryImageUrl = (image) => {
	if (!image || typeof image !== 'string') return '';

	const trimmed = image.trim();
	if (!trimmed) return '';

	if (/^https?:\/\//i.test(trimmed)) {
		return trimmed;
	}

	// Frontend static assets in /public/image — never prefix with admin API host
	if (trimmed.startsWith('/image/') || trimmed.startsWith('/icons/')) {
		return trimmed;
	}

	const adminBase = getAdminApiBase();
	return trimmed.startsWith('/') ? `${adminBase}${trimmed}` : `${adminBase}/${trimmed}`;
};
