/**
 * Lightweight performance benchmark for key routes.
 * Usage: node scripts/perf-benchmark.mjs --url http://localhost:3000 --out perf-results/baseline.json
 */
import { execSync, spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const ROUTES = ["/", "/get-the-visa", "/checkout", "/our-guarantee"];

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { url: "http://127.0.0.1:3000", out: null, label: "run" };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--url") out.url = args[i + 1];
    if (args[i] === "--out") out.out = args[i + 1];
    if (args[i] === "--label") out.label = args[i + 1];
  }
  return out;
}

async function waitForServer(baseUrl, attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(baseUrl, { redirect: "manual" });
      if (res.ok || res.status === 307 || res.status === 308) return true;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function measureRoute(baseUrl, route) {
  const url = `${baseUrl.replace(/\/$/, "")}${route}`;
  const samples = [];

  for (let i = 0; i < 3; i += 1) {
    const start = performance.now();
    const res = await fetch(url, { redirect: "follow" });
    const html = await res.text();
    const elapsed = performance.now() - start;
    samples.push({
      ms: Math.round(elapsed),
      status: res.status,
      htmlKB: Math.round((html.length / 1024) * 10) / 10,
    });
  }

  const avgMs = Math.round(samples.reduce((s, x) => s + x.ms, 0) / samples.length);
  const avgHtmlKB =
    Math.round((samples.reduce((s, x) => s + x.htmlKB, 0) / samples.length) * 10) / 10;

  return { route, url, avgMs, avgHtmlKB, samples };
}

function runLighthouse(baseUrl, route, outDir) {
  const url = `${baseUrl.replace(/\/$/, "")}${route}`;
  const safeName = route === "/" ? "home" : route.replace(/\//g, "_").replace(/^_/, "");
  const reportPath = join(outDir, `${safeName}-lighthouse.json`);

  try {
    execSync(
      `npx --yes lighthouse "${url}" --quiet --chrome-flags="--headless --no-sandbox" --only-categories=performance --output=json --output-path="${reportPath}"`,
      { stdio: "pipe", cwd: root, timeout: 180000 }
    );
    const json = JSON.parse(readFileSync(reportPath, "utf8"));
    const perf = json.categories?.performance;
    const audits = json.audits || {};
    return {
      route,
      score: perf?.score != null ? Math.round(perf.score * 100) : null,
      fcpMs: audits["first-contentful-paint"]?.numericValue ?? null,
      lcpMs: audits["largest-contentful-paint"]?.numericValue ?? null,
      tbtMs: audits["total-blocking-time"]?.numericValue ?? null,
      cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
      speedIndex: audits["speed-index"]?.numericValue ?? null,
    };
  } catch (error) {
    return { route, error: String(error.message || error) };
  }
}

function getBuildStats() {
  const buildManifest = join(root, ".next", "build-manifest.json");
  if (!existsSync(buildManifest)) return null;

  const manifest = JSON.parse(readFileSync(buildManifest, "utf8"));
  const pages = manifest.pages || {};
  const pageStats = Object.entries(pages).map(([page, files]) => {
    let total = 0;
    for (const file of files) {
      const filePath = join(root, ".next", file.startsWith("/") ? file.slice(1) : file);
      if (existsSync(filePath)) {
        total += readFileSync(filePath).length;
      }
    }
    return { page, jsKB: Math.round((total / 1024) * 10) / 10, fileCount: files.length };
  });

  pageStats.sort((a, b) => b.jsKB - a.jsKB);
  return pageStats;
}

async function main() {
  const { url, out, label } = parseArgs();
  const outDir = join(root, "perf-results");
  mkdirSync(outDir, { recursive: true });

  const ready = await waitForServer(url);
  if (!ready) {
    console.error(`Server not reachable at ${url}`);
    process.exit(1);
  }

  const fetchMetrics = [];
  for (const route of ROUTES) {
    fetchMetrics.push(await measureRoute(url, route));
    console.log(`Measured ${route}`);
  }

  const lighthouseMetrics = [];
  for (const route of ROUTES) {
    console.log(`Lighthouse ${route}...`);
    lighthouseMetrics.push(runLighthouse(url, route, outDir));
  }

  const buildStats = getBuildStats();
  const result = {
    label,
    capturedAt: new Date().toISOString(),
    baseUrl: url,
    fetchMetrics,
    lighthouseMetrics,
    buildStats,
  };

  const outPath = out || join(outDir, `${label}.json`);
  writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`\nSaved ${outPath}`);
  console.log(JSON.stringify({ lighthouseMetrics, topPages: buildStats?.slice(0, 6) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
