/**
 * Internal reference capture for docs/rtx-live-spec.md (not shipped to users).
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = new URL("../docs/reference/rtx-live/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const STATIC_ROUTES = [
  ["home", "https://rtx.live/"],
  ["gpus-index", "https://rtx.live/gpus"],
  ["gpu-5070", "https://rtx.live/gpus/geforce-rtx-5070"],
  ["card-5070-ventus", "https://rtx.live/cards/msi-geforce-rtx-5070-ventus-2x-overclocked-dual-fan-12gb-gddr7"],
  ["cards-all", "https://rtx.live/cards"],
  ["cards-in-stock", "https://rtx.live/cards?avail=stock"],
  ["deals", "https://rtx.live/deals"],
  ["stores", "https://rtx.live/stores"],
  ["finder", "https://rtx.live/finder"],
  ["compare", "https://rtx.live/compare"],
  ["preferences", "https://rtx.live/preferences"],
  ["alerts-signup", "https://rtx.live/auth/signup"],
  ["brand-msi", "https://rtx.live/brands/msi"],
];

async function shot(page, name, suffix) {
  const path = `${OUT}/${name}-${suffix}.png`;
  await page.screenshot({ path, fullPage: true });
  return path;
}

const browser = await chromium.launch();
const log = [];

for (const vp of [
  { suffix: "desktop-1440", width: 1440, height: 900 },
  { suffix: "mobile-390", width: 390, height: 844 },
]) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();

  for (const [name, url] of STATIC_ROUTES) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
      await page.waitForTimeout(2500);
      await shot(page, name, vp.suffix);
      log.push(`ok ${name} ${vp.suffix}`);
    } catch (e) {
      log.push(`fail ${name} ${vp.suffix}: ${e.message}`);
    }
  }

  // Theme on home (light)
  try {
    await page.goto("https://rtx.live/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const themeBtn = page.getByRole("button", { name: /light|dark theme/i });
    if (await themeBtn.count()) {
      await themeBtn.first().click();
      await page.waitForTimeout(800);
      await shot(page, "home-theme-light", vp.suffix);
    }
  } catch (e) {
    log.push(`theme ${vp.suffix}: ${e.message}`);
  }

  // Search interaction (desktop-ish)
  if (vp.width >= 1024) {
    try {
      await page.goto("https://rtx.live/", { waitUntil: "domcontentloaded" });
      const search = page.getByRole("searchbox", { name: /search/i });
      await search.fill("5070 Ti");
      await page.waitForTimeout(1200);
      await shot(page, "search-5070ti-results", vp.suffix);
    } catch (e) {
      log.push(`search ${vp.suffix}: ${e.message}`);
    }
  }

  // Mobile nav
  if (vp.width < 500) {
    try {
      await page.goto("https://rtx.live/", { waitUntil: "domcontentloaded" });
      const menu = page.getByRole("button", { name: /menu|navigation/i });
      if (await menu.count()) {
        await menu.first().click();
        await page.waitForTimeout(600);
        await shot(page, "mobile-nav-open", vp.suffix);
      }
    } catch (e) {
      log.push(`mobile-nav ${vp.suffix}: ${e.message}`);
    }
  }

  // Open box tab / deals subtype on home — try Fresh finds tab via text
  try {
    await page.goto("https://rtx.live/", { waitUntil: "domcontentloaded" });
    const openBox = page.getByRole("tab", { name: /open box/i });
    if (await openBox.count()) {
      await openBox.first().click();
      await page.waitForTimeout(800);
      await shot(page, "home-tab-openbox", vp.suffix);
    }
  } catch (e) {
    log.push(`openbox tab ${vp.suffix}: ${e.message}`);
  }

  await context.close();
}

// Discover first store detail link
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto("https://rtx.live/stores", { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(2000);
    const link = page.locator('a[href*="/stores/"]').first();
    const href = (await link.count()) ? await link.getAttribute("href") : null;
    if (href) {
      await page.goto(`https://rtx.live${href}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      await shot(page, "store-detail", "desktop-1440");
      log.push(`store ${href}`);
    }
  } catch (e) {
    log.push(`store-detail: ${e.message}`);
  }
  await page.close();
}

await browser.close();
console.log(log.join("\n"));