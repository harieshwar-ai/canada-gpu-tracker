import assert from "node:assert/strict";
import test from "node:test";
import { matchGpuFromText, extractBrand } from "../match/gpu";

test("GPU matcher picks RTX 5070 Ti before 5070", () => {
  const m = matchGpuFromText("MSI GeForce RTX 5070 Ti 16G VENTUS");
  assert.equal(m?.gpuSlug, "rtx-5070-ti");
});

test("GPU matcher picks RTX PRO 5000", () => {
  const m = matchGpuFromText("PNY NVIDIA RTX PRO 5000 48GB");
  assert.equal(m?.gpuSlug, "rtx-pro-5000");
  assert.equal(m?.productLine, "rtx_pro");
});

test("brand extraction", () => {
  assert.equal(extractBrand("ZOTAC GAMING GeForce RTX 5060"), "ZOTAC");
});