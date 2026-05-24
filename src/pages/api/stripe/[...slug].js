import { getBackendApiBase } from "@/utils/adminApiBase";

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
				"Payment service is not configured. Set BACKEND_API_URL or NEXT_PUBLIC_API_URL on the server.",
		});
	}

	const url = `${backendBase}/stripe_payment/${slug}`;
	const authHeader = req.headers.authorization;

	try {
		const response = await fetch(url, {
			method: req.method,
			headers: {
				"Content-Type": req.headers["content-type"] || "application/json",
				Accept: "application/json",
				...(authHeader ? { Authorization: authHeader } : {}),
			},
			body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body ?? {}) : undefined,
		});

		const contentType = response.headers.get("content-type") || "";
		const payload = contentType.includes("application/json")
			? await response.json()
			: { message: await response.text() };

		return res.status(response.status).json(payload);
	} catch (error) {
		console.error(`Stripe proxy error (${slug}):`, error?.message || error);
		return res.status(502).json({
			status: "error",
			message: "Could not reach the payment server. Please try again.",
		});
	}
}

export const config = {
	api: {
		bodyParser: true,
	},
};
