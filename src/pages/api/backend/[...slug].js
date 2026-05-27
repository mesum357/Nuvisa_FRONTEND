import { getBackendApiBase } from "@/utils/adminApiBase";

const UPSTREAM_TIMEOUT_MS = 90_000;

export const config = {
	api: {
		bodyParser: false,
		externalResolver: true,
	},
};

function readRawBody(req) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		req.on("data", (chunk) => chunks.push(chunk));
		req.on("end", () => resolve(Buffer.concat(chunks)));
		req.on("error", reject);
	});
}

function buildQueryString(query) {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(query)) {
		if (key === "slug" || value == null) continue;
		if (Array.isArray(value)) {
			value.forEach((entry) => params.append(key, String(entry)));
		} else {
			params.append(key, String(value));
		}
	}
	const qs = params.toString();
	return qs ? `?${qs}` : "";
}

export default async function handler(req, res) {
	const slugParts = req.query.slug;
	const slug = Array.isArray(slugParts) ? slugParts.join("/") : slugParts || "";

	if (!slug) {
		return res.status(400).json({ status: "error", message: "Missing backend route" });
	}

	const backendBase = getBackendApiBase();
	if (!backendBase) {
		return res.status(503).json({
			status: "error",
			message:
				"Backend API is not configured. Set BACKEND_API_URL on the frontend server.",
		});
	}

	const url = `${backendBase}/${slug}${buildQueryString(req.query)}`;
	const authHeader = req.headers.authorization;
	const contentType = req.headers["content-type"];

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

	try {
		let body;
		if (req.method !== "GET" && req.method !== "HEAD") {
			const raw = await readRawBody(req);
			body = raw.length > 0 ? raw : undefined;
		}

		const response = await fetch(url, {
			method: req.method,
			headers: {
				Accept: req.headers.accept || "application/json",
				...(contentType ? { "Content-Type": contentType } : {}),
				...(authHeader ? { Authorization: authHeader } : {}),
			},
			body,
			signal: controller.signal,
		});

		const responseType = response.headers.get("content-type") || "";

		if (responseType.includes("application/json")) {
			const payload = await response.json();
			return res.status(response.status).json(payload);
		}

		const buffer = Buffer.from(await response.arrayBuffer());
		if (responseType) {
			res.setHeader("Content-Type", responseType);
		}
		const disposition = response.headers.get("content-disposition");
		if (disposition) {
			res.setHeader("Content-Disposition", disposition);
		}
		return res.status(response.status).send(buffer);
	} catch (error) {
		const isAbort = error?.name === "AbortError";
		console.error(`Backend proxy error (${slug}):`, error?.message || error);
		return res.status(isAbort ? 504 : 502).json({
			status: "error",
			message: isAbort
				? "Backend server took too long to respond."
				: "Could not reach the backend server.",
		});
	} finally {
		clearTimeout(timeoutId);
	}
}
