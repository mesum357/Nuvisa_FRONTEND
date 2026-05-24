import { getBackendApiBase } from "@/utils/adminApiBase";

const UPSTREAM_TIMEOUT_MS = 90_000;

export default async function handler(req, res) {
	const slugParts = req.query.slug;
	const slug = Array.isArray(slugParts) ? slugParts.join("/") : slugParts || "";

	if (!slug) {
		return res.status(400).json({ status: "error", message: "Missing payment route" });
	}

	const backendBase = getBackendApiBase();
	if (!backendBase) {
		return res.status(503).json({
			status: "error",
			message:
				"Payment service is not configured. Set BACKEND_API_URL to your NestJS URL on Render.",
		});
	}

	const url = `${backendBase}/stripe_payment/${slug}`;
	const authHeader = req.headers.authorization;
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

	try {
		const response = await fetch(url, {
			method: req.method,
			headers: {
				"Content-Type": req.headers["content-type"] || "application/json",
				Accept: "application/json",
				...(authHeader ? { Authorization: authHeader } : {}),
			},
			body:
				req.method !== "GET" && req.method !== "HEAD"
					? JSON.stringify(req.body ?? {})
					: undefined,
			signal: controller.signal,
		});

		const contentType = response.headers.get("content-type") || "";
		const payload = contentType.includes("application/json")
			? await response.json()
			: { message: await response.text() };

		return res.status(response.status).json(payload);
	} catch (error) {
		const isAbort = error?.name === "AbortError";
		console.error(`Stripe proxy error (${slug}):`, error?.message || error);
		return res.status(isAbort ? 504 : 502).json({
			status: "error",
			message: isAbort
				? "Payment server took too long to respond. Please wait a moment and try again."
				: "Could not reach the payment server. Please try again.",
		});
	} finally {
		clearTimeout(timeoutId);
	}
}

export const config = {
	api: {
		bodyParser: true,
	},
};
