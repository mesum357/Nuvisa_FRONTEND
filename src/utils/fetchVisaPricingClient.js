/**
 * Browser-safe visa pricing fetch — same-origin only (no CORS / no localhost fallbacks).
 */
export async function fetchVisaPricingResults() {
	try {
		const res = await fetch('/api/visa-pricing', { method: 'GET' });
		if (!res.ok) {
			return { results: [], ok: false };
		}
		const json = await res.json();
		if (String(json?.status || '').toUpperCase() === 'ERROR') {
			return { results: [], ok: false };
		}
		const results = json?.data?.results;
		return {
			results: Array.isArray(results) ? results : [],
			ok: true,
		};
	} catch {
		return { results: [], ok: false };
	}
}
