import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "..", "web", "dist");
const OUT = path.join(__dirname, "..", "docs", "screenshots", "e2e");

const CAPTURES = [
  { file: "home-desktop-1440.png", path: "/", width: 1440, height: 900 },
  { file: "home-mobile-390.png", path: "/", width: 390, height: 844 },
  {
    file: "card-cc-5070ti-desktop-1440.png",
    path: "/cards/msi-rtx-5070-ti-vcmsi00514-canada-computers/",
    width: 1440,
    height: 900,
  },
  {
    file: "card-cc-5070ti-mobile-390.png",
    path: "/cards/msi-rtx-5070-ti-vcmsi00514-canada-computers/",
    width: 390,
    height: 844,
  },
];

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css";
  if (filePath.endsWith(".js")) return "application/javascript";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

function startStaticServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      let urlPath = req.url?.split("?")[0] ?? "/";
      if (urlPath.endsWith("/")) urlPath += "index.html";
      const filePath = path.join(DIST, decodeURIComponent(urlPath));
      try {
        const body = await readFile(filePath);
        res.writeHead(200, { "Content-Type": contentType(filePath) });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end("Not found");
      }
    });
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      resolve({ server, base: `http://127.0.0.1:${port}` });
    });
  });
}

const { server, base } = await startStaticServer();
const browser = await chromium.launch();
try {
  for (const cap of CAPTURES) {
    const page = await browser.newPage({
      viewport: { width: cap.width, height: cap.height },
    });
    await page.goto(base + cap.path, { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(OUT, cap.file),
      fullPage: true,
    });
    await page.close();
    console.log(`wrote ${cap.file} (${cap.width}x${cap.height})`);
  }
} finally {
  await browser.close();
  server.close();
}