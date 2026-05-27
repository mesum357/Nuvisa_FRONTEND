import { preferCountryWebp } from "@/utils/countryImage";

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

/** Production NestJS host (Render). Used when env still points at localhost. */
const DEFAULT_PRODUCTION_BACKEND_URL = "https://nuvisa-backend.onrender.com";

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

const BACKEND_PROXY_PREFIX = "/api/backend";

/** NestJS backend base URL for browser-side API calls. */
export const getPublicApiBase = () => {
	// Same-origin proxy on deployed hosts — avoids separate api-* subdomain DNS/CORS issues.
	if (isDeployedBrowser()) {
		return BACKEND_PROXY_PREFIX;
	}

	const raw = process.env.NEXT_PUBLIC_API_URL;
	if (raw && !(isDeployedBrowser() && isLocalhost(raw))) {
		return raw.replace(/\/+$/, "");
	}
	if (isDeployedBrowser() || process.env.RENDER === "true") {
		return DEFAULT_PRODUCTION_BACKEND_URL;
	}
	return raw ? raw.replace(/\/+$/, "") : "";
};

/** NestJS backend URL for Next.js API route proxies (server-only env preferred). */
export const getBackendApiBase = () => {
	const serverUrl = process.env.BACKEND_API_URL || process.env.API_URL;
	// Server-only vars are trusted even on localhost — used for same-VPS proxies (e.g. 127.0.0.1:4001).
	if (serverUrl) {
		return String(serverUrl).replace(/\/+$/, "");
	}

	const raw = process.env.NEXT_PUBLIC_API_URL;
	if (raw && !(process.env.NODE_ENV === "production" && isLocalhost(raw))) {
		return raw.replace(/\/+$/, "");
	}

	if (process.env.NODE_ENV === "production" || process.env.RENDER === "true") {
		return DEFAULT_PRODUCTION_BACKEND_URL;
	}

	return raw ? raw.replace(/\/+$/, "") : "";
};

/** True when browser/API calls should use the same-origin backend proxy. */
export const hasBrowserBackendProxy = () =>
	isDeployedBrowser() && Boolean(getBackendApiBase() || process.env.NEXT_PUBLIC_API_URL);

const STRIPE_PROXY_PREFIX = "/api/stripe/";

/** Payment routes: same-origin proxy on deployed sites (fast, warm frontend → backend). */
export const resolvePaymentApiUrl = (endpoint) => {
	if (!endpoint.startsWith("/stripe_payment/")) {
		return endpoint;
	}

	const slug = endpoint.slice("/stripe_payment/".length);

	if (isDeployedBrowser()) {
		return `${STRIPE_PROXY_PREFIX}${slug}`;
	}

	const base = getPublicApiBase();
	if (base) {
		return `${base}${endpoint}`;
	}

	return `${STRIPE_PROXY_PREFIX}${slug}`;
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
		return preferCountryWebp(trimmed);
	}

	const adminBase = getAdminApiBase();
	const resolved = trimmed.startsWith('/') ? `${adminBase}${trimmed}` : `${adminBase}/${trimmed}`;
	return preferCountryWebp(resolved);
};
