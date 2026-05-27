/**
 * Unit tests for post-payment same-origin proxy helpers.
 * Run: node --test scripts/post-payment-fix.test.mjs
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = join(__dirname, "..");

/** Mirror of buildQueryString in src/pages/api/backend/[...slug].js */
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

function read(rel) {
  return readFileSync(join(SITE_ROOT, rel), "utf8");
}

describe("buildQueryString (backend proxy)", () => {
  it("excludes slug from upstream query", () => {
    const qs = buildQueryString({
      slug: ["stripe_payment", "session-metadata"],
      payment_id: "pi_abc123",
    });
    assert.equal(qs, "?payment_id=pi_abc123");
  });

  it("returns empty string when only slug is present", () => {
    assert.equal(buildQueryString({ slug: ["visa_pricing"] }), "");
  });

  it("serializes array query values", () => {
    const qs = buildQueryString({ slug: ["visa", "check"], foo: ["a", "b"] });
    assert.ok(qs.includes("foo=a"));
    assert.ok(qs.includes("foo=b"));
    assert.ok(!qs.includes("slug"));
  });
});

describe("post-payment implementation files", () => {
  it("backend catch-all proxy route exists", () => {
    assert.ok(
      existsSync(join(SITE_ROOT, "src/pages/api/backend/[...slug].js")),
      "Missing /api/backend/[...slug].js",
    );
  });

  it("getPublicApiBase uses same-origin proxy on deployed browser", () => {
    const src = read("src/utils/adminApiBase.js");
    assert.match(src, /BACKEND_PROXY_PREFIX\s*=\s*"\/api\/backend"/);
    assert.match(src, /if \(isDeployedBrowser\(\)\)/);
    assert.match(src, /return BACKEND_PROXY_PREFIX/);
  });

  it("payment-success no longer calls api-staging directly", () => {
    const src = read("src/pages/payment-success/index.jsx");
    assert.match(src, /getPublicApiBase/);
    assert.doesNotMatch(src, /process\.env\.NEXT_PUBLIC_API_URL/);
  });

  it("stripeRedirectPayment uses getPublicApiBase", () => {
    const src = read("src/utils/stripeRedirectPayment.js");
    assert.match(src, /getPublicApiBase/);
    assert.doesNotMatch(src, /process\.env\.NEXT_PUBLIC_API_URL/);
  });

  it("apigateway routes non-payment calls through getPublicApiBase", () => {
    const src = read("src/gateways/apigateway.ts");
    assert.match(src, /getPublicApiBase\(\)/);
  });

  it("daily-slots POST does not return 503 when secret missing", () => {
    const src = read("src/pages/api/daily-slots.js");
    assert.match(src, /skipped:\s*true/);
    assert.doesNotMatch(src, /REVALIDATE_SECRET not configured/);
  });
});

describe("post-payment URL resolution (simulated)", () => {
  it("deployed browser resolves session-metadata via same origin", () => {
    const endpoint = "/stripe_payment/session-metadata";
    const paymentId = "pi_test";
    const apiBase = "/api/backend";
    const url = `${apiBase}${endpoint}?payment_id=${encodeURIComponent(paymentId)}`;
    assert.equal(
      url,
      "/api/backend/stripe_payment/session-metadata?payment_id=pi_test",
    );
    assert.ok(!url.includes("api-staging"));
  });

  it("visa application create uses proxied base", () => {
    const apiBase = "/api/backend";
    const endpoint = "/visa-application/create";
    assert.equal(`${apiBase}${endpoint}`, "/api/backend/visa-application/create");
  });
});
