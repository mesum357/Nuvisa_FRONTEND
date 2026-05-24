/**
 * Resize marketing PNGs to WebP for homepage performance.
 * Requires: npm install --save-dev sharp
 *
 * Usage: node scripts/optimize-marketing-images.mjs
 */
import { existsSync } from "node:fs";
import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

const JOBS = [
  {
    dir: "image",
    files: ["choose_country.png", "everyday_steals.png"],
    maxWidth: 900,
    quality: 80,
  },
  {
    dir: "img",
    files: null,
    maxWidth: 96,
    quality: 82,
  },
];

async function loadSharp() {
  try {
    const mod = await import("sharp");
    return mod.default;
  } catch {
    console.error(
      "Install sharp first: npm install --save-dev sharp",
    );
    process.exit(1);
  }
}

async function toWebp(sharp, inputPath, outputPath, maxWidth, quality) {
  await sharp(inputPath)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality })
    .toFile(outputPath);
  const { size } = await import("node:fs/promises").then((fs) =>
    fs.stat(outputPath),
  );
  console.log(
    `  ${path.basename(inputPath)} → ${path.basename(outputPath)} (${Math.round(size / 1024)} KB)`,
  );
}

async function main() {
  const sharp = await loadSharp();

  for (const job of JOBS) {
    const dirPath = path.join(publicDir, job.dir);
    if (!existsSync(dirPath)) {
      console.warn(`Skip missing dir: ${job.dir}`);
      continue;
    }

    const names =
      job.files ??
      (await readdir(dirPath)).filter((n) => /\.png$/i.test(n));

    for (const name of names) {
      const inputPath = path.join(dirPath, name);
      if (!existsSync(inputPath)) continue;

      const outputPath = inputPath.replace(/\.png$/i, ".webp");
      await toWebp(sharp, inputPath, outputPath, job.maxWidth, job.quality);
    }
  }

  console.log("\nDone. Commit the new .webp files and redeploy.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
