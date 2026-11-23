import { readFile } from "node:fs/promises";
import { chromium } from "playwright";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "..", "web", "dist");
const indexHtml = await readFile(path.join(DIST, "index.html"), "utf8");
const cardHtml = await readFile(
  path.join(
    DIST,
    "cards",
    "msi-rtx-5070-ti-vcmsi00514-canada-computers",
    "index.html"
  ),
  "utf8"
);

const checks = [];

function pass(id, name, ok, detail) {
  checks.push({ id, name, ok, detail });
}

// 1 Headline stats (no placeholder inflation)
const statsMatch = indexHtml.match(
  /<dd>(\d+)<\/dd>\s*<dt>offers in stock<\/dt>/
);
const offersInStock = statsMatch ? Number(statsMatch[1]) : -1;
pass(
  1,
  "Placeholder excluded from hero stats",
  offersInStock <= 20 && offersInStock > 0 && !indexHtml.includes("$6,450.00"),
  `offers in stock=${offersInStock}, no 5090 placeholder price in home HTML`
);

// 3 Spec line
pass(
  3,
  "Empty spec fields hidden",
  !cardHtml.includes("mm · s ·") && !cardHtml.match(/W PSU<\/p>\s*<p class="mono[^"]*">\s*mm/),
  "card page has no empty spec pattern"
);

// 4 Banner
pass(
  4,
  "Banner styled",
  indexHtml.includes('class="notice-banner"') &&
    indexHtml.includes("illustrative, not real prices"),
  "notice-banner with Example pill copy"
);

// 5 Live changes
pass(
  5,
  "Live changes populated or empty state",
  indexHtml.includes("Live changes") &&
    (indexHtml.includes("First seen") ||
      indexHtml.includes("No live ingested prices")),
  "live changes section has entries or empty message"
);

// 6 No stub alert
pass(
  6,
  "No visible stub alert CTA",
  !cardHtml.includes("Set a price alert (stub)") &&
    !indexHtml.includes("Set a price alert (stub)"),
  "grep dist for stub alert text"
);

// No CC outbound links
let ccHrefs = 0;
for (const p of await import("node:fs/promises").then((fs) =>
  fs.readdir(DIST, { recursive: true, withFileTypes: true })
)) {
  if (!p.isFile() || !p.name.endsWith(".html")) continue;
  const rel = path.join(p.parentPath ?? p.path, p.name);
  const html = await readFile(rel, "utf8");
  if (/canadacomputers\.com/i.test(html)) ccHrefs++;
}
pass(
  "A",
  "No canadacomputers.com in dist",
  ccHrefs === 0,
  `files with CC href: ${ccHrefs}`
);

// OG / meta on home
pass(
  "B",
  "OG/meta on home",
  indexHtml.includes('property="og:title"') &&
    indexHtml.includes('property="og:image"') &&
    indexHtml.includes('rel="canonical"'),
  "og:title, og:image, canonical present"
);

// 2 Mobile overflow
function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      let urlPath = req.url?.split("?")[0] ?? "/";
      if (urlPath.endsWith("/")) urlPath += "index.html";
      const filePath = path.join(DIST, decodeURIComponent(urlPath));
      try {
        const body = await readFile(filePath);
        res.writeHead(200);
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end();
      }
    });
    server.listen(0, "127.0.0.1", () => {
      resolve({
        server,
        base: `http://127.0.0.1:${server.address().port}`,
      });
    });
  });
}

const { server, base } = await startServer();
const browser = await chromium.launch();
const paths = ["/", "/cards/", "/finder/", "/cards/msi-rtx-5070-ti-vcmsi00514-canada-computers/"];
let overflowOk = true;
let overflowDetail = "";
try {
  for (const p of paths) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(base + p, { waitUntil: "networkidle" });
    const metrics = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      vw: window.innerWidth,
    }));
    if (metrics.sw > metrics.vw + 2) {
      overflowOk = false;
      overflowDetail += `${p}: scrollWidth ${metrics.sw} > ${metrics.vw}; `;
    }
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
pass(2, "No horizontal overflow at 390px", overflowOk, overflowDetail || "scrollWidth <= viewport on 4 pages");

// 7 Screenshot sizes (viewport files)
const { createHash } = await import("node:crypto");
const deskPath = path.join(
  __dirname,
  "..",
  "docs/screenshots/e2e/card-cc-5070ti-desktop-1440.png"
);
const mobPath = path.join(
  __dirname,
  "..",
  "docs/screenshots/e2e/card-cc-5070ti-mobile-390.png"
);
const deskHash = createHash("md5")
  .update(await readFile(deskPath))
  .digest("hex");
const mobHash = createHash("md5")
  .update(await readFile(mobPath))
  .digest("hex");
pass(
  7,
  "Screenshots retaken (desktop ≠ mobile)",
  deskHash !== mobHash,
  `desktop md5=${deskHash.slice(0, 8)}… mobile md5=${mobHash.slice(0, 8)}…`
);

let allPass = true;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} [${c.id}] ${c.name} — ${c.detail}`);
  if (!c.ok) allPass = false;
}
process.exit(allPass ? 0 : 1);