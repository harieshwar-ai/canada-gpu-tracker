import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";
import { parseCanadaComputersProduct } from "../parsers/canada-computers";
import { parsePcCanadaProduct } from "../parsers/pc-canada";
import { parseMikesProduct } from "../parsers/mikes-computer-shop";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, "..", "fixtures");

async function loadFixture(...parts: string[]) {
  return readFile(path.join(fixtures, ...parts), "utf8");
}

test("Canada Computers parser reads JSON-LD product", async () => {
  const html = await loadFixture(
    "canada-computers",
    "msi-rtx-5070ti-ventus.html"
  );
  const parsed = parseCanadaComputersProduct(
    html,
    "https://www.canadacomputers.com/en/powered-by-nvidia/282429/msi-geforce-rtx-5070-ti-16g-ventus-3x-pz-16gb-gddr7-graphics-card-rtx-5070-ti-16g-ventus-3x-pz-oc.html"
  );
  assert.ok(parsed);
  assert.equal(parsed!.gpuSlug, "rtx-5070-ti");
  assert.equal(parsed!.brand, "MSI");
  assert.equal(parsed!.sku, "VCMSI00514");
  assert.equal(parsed!.priceCad, 1989.99);
  assert.equal(
    parsed!.inStockOnline,
    false,
    "online stock follows delivery text, not store counts"
  );
  assert.ok((parsed!.storeStock?.filter((s) => s.quantity > 0).length ?? 0) >= 12);
});

test("Canada Computers parser: sold out online but in-store stock", async () => {
  const html = await loadFixture(
    "canada-computers",
    "msi-rtx-5070ti-ventus.html"
  );
  const parsed = parseCanadaComputersProduct(html, "https://example.test/cc");
  assert.ok(parsed);
  assert.equal(parsed!.inStockOnline, false);
  const burnaby = parsed!.storeStock?.find((s) => s.storeKey === "cc-burnaby");
  assert.ok(burnaby && burnaby.quantity >= 0, "store rows remain independent");
  assert.ok(
    parsed!.storeStock!.some((s) => s.quantity > 0),
    "in-store availability still parsed"
  );
});

test("Canada Computers parser: in stock online when delivery says so", () => {
  const html = `
    <script type="application/ld+json">{"@type":"Product","name":"ZOTAC RTX 5060","brand":{"name":"ZOTAC"},"sku":"VCZOT00281OB","offers":{"price":636.49,"availability":"https://schema.org/InStock"}}</script>
    <h1 class="product-title">ZOTAC GAMING GeForce RTX 5060 AMP 8GB GDDR7(Open Box)</h1>
    <p id="delivery-text" class="mt-1">In stock online</p>
    <span class="col-3">Burnaby</span><span class="shop-online-box">1</span>
  `;
  const parsed = parseCanadaComputersProduct(html, "https://example.test/cc/5060");
  assert.ok(parsed);
  assert.equal(parsed!.inStockOnline, true);
  assert.equal(parsed!.storeStock?.find((s) => s.storeKey === "cc-burnaby")?.quantity, 1);
});

test("Canada Computers parser maps Edmonton store labels", async () => {
  const html = await loadFixture(
    "canada-computers",
    "msi-rtx-5070ti-ventus.html"
  );
  const parsed = parseCanadaComputersProduct(html, "https://example.test/cc");
  assert.ok(
    parsed?.storeStock?.some((s) => s.storeKey === "cc-edmonton-south-park")
  );
});

test("PC-Canada parser reads in-stock price", async () => {
  const html = await loadFixture("pc-canada", "zotac-rtx-5070-amp.html");
  const parsed = parsePcCanadaProduct(
    html,
    "https://www.pc-canada.com/item/zotac-nvidia-geforce-rtx-5070-graphic-card/zt-b50700fq-10a"
  );
  assert.ok(parsed);
  assert.equal(parsed!.priceCad, 1468.99);
  assert.equal(parsed!.inStockOnline, true);
  assert.equal(parsed!.gpuSlug, "rtx-5070");
});

test("PC-Canada parser reads out-of-stock", async () => {
  const html = await loadFixture("pc-canada", "msi-rtx-5070-out.html");
  const parsed = parsePcCanadaProduct(html, "https://example.test/msi");
  assert.ok(parsed);
  assert.equal(parsed!.inStockOnline, false);
});

test("Mike's parser reads price and stock", async () => {
  const html = await loadFixture(
    "mikes-computer-shop",
    "msi-rtx-5070-ventus.html"
  );
  const parsed = parseMikesProduct(
    html,
    "https://www.mikescomputershop.com/product/msi_geforce_rtx_5070_ventus_2x_oc_12gb/83036"
  );
  assert.ok(parsed);
  assert.equal(parsed!.priceCad, 829.99);
  assert.equal(parsed!.inStockOnline, true);
  assert.equal(parsed!.gpuSlug, "rtx-5070");
});