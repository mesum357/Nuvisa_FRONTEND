import { chromium } from "playwright";

const url = process.argv[2] || "https://staging.nuvisa.co.uk/";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const logs = [];
const bad = [];

page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") {
    logs.push(`${m.type()}: ${m.text()}`);
  }
});
page.on("pageerror", (e) => logs.push(`PAGEERROR: ${e.message}`));
page.on("response", (r) => {
  if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
});

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(2500);

console.log(`URL: ${url}`);
console.log("\n=== CONSOLE ===");
console.log(logs.join("\n") || "(none)");
console.log("\n=== HTTP 4xx/5xx ===");
console.log(bad.slice(0, 20).join("\n") || "(none)");

await browser.close();
