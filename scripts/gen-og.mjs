// gen-og.mjs — render scripts/og-card.html to public/og.png (1200x630) via Playwright chromium.
// Run: node scripts/gen-og.mjs. Regenerate whenever the card design changes. The PNG is committed to
// public/ so the build copies it to dist/ and the OG/Twitter <meta> images resolve.

import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const cardUrl = "file://" + join(here, "og-card.html").replace(/\\/g, "/");
const out = join(here, "..", "public", "og.png");

import { readFileSync } from "node:fs";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(cardUrl, { waitUntil: "networkidle" });
await page.waitForTimeout(200);
await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
console.log("[gen-og] wrote", out);

// Rasterize the brand favicon.svg to the PNG icons link-embed clients + home screens expect
// (apple-touch-icon 180, maskable/any 192 + 512). The SVG has a rounded dark tile + gold heart.
const svg = readFileSync(join(here, "..", "public", "favicon.svg"), "utf8");
const iconSizes = [
  { file: "apple-touch-icon.png", size: 180 },
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
];
for (const { file, size } of iconSizes) {
  const p = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await p.setContent(
    `<!doctype html><html><body style="margin:0"><div style="width:${size}px;height:${size}px">${svg.replace(
      "<svg ",
      `<svg width="${size}" height="${size}" `,
    )}</div></body></html>`,
    { waitUntil: "networkidle" },
  );
  await p.screenshot({ path: join(here, "..", "public", file), clip: { x: 0, y: 0, width: size, height: size } });
  await p.close();
  console.log("[gen-og] wrote public/" + file);
}
await browser.close();
