-- Seed catalog + placeholder-only retailer offers (cleared retailers: live ingester only)

INSERT INTO gpus (id, slug, model_name, series, product_line, chip, vram_gb, msrp_cad, launch_msrp_cad) VALUES
  ('00000000-0000-4000-a000-000000000001', 'rtx-5090', 'GeForce RTX 5090', '50-series', 'geforce', 'Blackwell GB202', 32, 2899.99, 2899.99),
  ('00000000-0000-4000-a000-000000000002', 'rtx-5080', 'GeForce RTX 5080', '50-series', 'geforce', 'Blackwell GB203', 16, 1599.99, 1599.99),
  ('00000000-0000-4000-a000-000000000003', 'rtx-5070-ti', 'GeForce RTX 5070 Ti', '50-series', 'geforce', 'Blackwell GB203', 16, 1099.99, 1099.99),
  ('00000000-0000-4000-a000-000000000004', 'rtx-5070', 'GeForce RTX 5070', '50-series', 'geforce', 'Blackwell GB205', 12, 799.99, 799.99),
  ('00000000-0000-4000-a000-000000000005', 'rtx-5060-ti-16gb', 'GeForce RTX 5060 Ti 16GB', '50-series', 'geforce', 'Blackwell GB206', 16, 629.99, 629.99),
  ('00000000-0000-4000-a000-000000000006', 'rtx-5060-ti-8gb', 'GeForce RTX 5060 Ti 8GB', '50-series', 'geforce', 'Blackwell GB206', 8, 549.99, 549.99),
  ('00000000-0000-4000-a000-000000000007', 'rtx-5060', 'GeForce RTX 5060', '50-series', 'geforce', 'Blackwell GB206', 8, 449.99, 449.99),
  ('00000000-0000-4000-a000-000000000008', 'rtx-5050', 'GeForce RTX 5050', '50-series', 'geforce', 'Blackwell GB207', 8, 379.99, 379.99),
  ('00000000-0000-4000-a000-000000000009', 'rtx-pro-5000', 'NVIDIA RTX PRO 5000', 'other', 'rtx_pro', 'Blackwell', 48, 12499.99, 12499.99),
  ('00000000-0000-4000-a000-000000000010', 'rtx-pro-4000', 'NVIDIA RTX PRO 4000', 'other', 'rtx_pro', 'Blackwell', 24, 4199.99, 4199.99),
  ('00000000-0000-4000-a000-000000000011', 'rtx-4060', 'GeForce RTX 4060', '40-series', 'geforce', 'Ada AD107', 8, 399.99, 399.99)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO retailers (id, slug, name, website_url, country_code, has_physical_stores, is_cleared, is_placeholder) VALUES
  ('00000000-0000-4000-a000-000000000100', 'pc-canada', 'PC-Canada', 'https://www.pc-canada.com', 'CA', false, true, false),
  ('00000000-0000-4000-a000-000000000101', 'mikes-computer-shop', 'Mike''s Computer Shop', 'https://www.mikescomputershop.com', 'CA', false, true, false),
  ('00000000-0000-4000-a000-000000000102', 'best-buy-ca', 'Best Buy Canada', 'https://www.bestbuy.ca', 'CA', true, false, true),
  ('00000000-0000-4000-a000-000000000103', 'canada-computers', 'Canada Computers', 'https://www.canadacomputers.com', 'CA', true, true, false),
  ('00000000-0000-4000-a000-000000000104', 'memory-express', 'Memory Express', 'https://www.memoryexpress.com', 'CA', true, false, true),
  ('00000000-0000-4000-a000-000000000105', 'newegg-ca', 'Newegg.ca', 'https://www.newegg.ca', 'CA', false, false, true),
  ('00000000-0000-4000-a000-000000000106', 'amazon-ca', 'Amazon.ca', 'https://www.amazon.ca', 'CA', false, false, true),
  ('00000000-0000-4000-a000-000000000107', 'visions', 'Visions Electronics', 'https://www.visions.ca', 'CA', true, false, true),
  ('00000000-0000-4000-a000-000000000108', 'staples-ca', 'Staples Canada', 'https://www.staples.ca', 'CA', true, false, true),
  ('00000000-0000-4000-a000-000000000109', 'walmart-ca', 'Walmart.ca', 'https://www.walmart.ca', 'CA', true, false, true),
  ('00000000-0000-4000-a000-000000000110', 'ebay-ca', 'eBay.ca', 'https://www.ebay.ca', 'CA', false, false, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO stores (id, retailer_id, slug, name, city, province_code, country_code, latitude, longitude) VALUES
  ('00000000-0000-4000-a000-000000000300', '00000000-0000-4000-a000-000000000103', 'cc-markham', 'Canada Computers Markham', 'Markham', 'ON', 'CA', 43.8563, -79.337),
  ('00000000-0000-4000-a000-000000000301', '00000000-0000-4000-a000-000000000103', 'cc-vancouver', 'Canada Computers Vancouver', 'Vancouver', 'BC', 'CA', 49.2634, -123.137),
  ('00000000-0000-4000-a000-000000000302', '00000000-0000-4000-a000-000000000104', 'me-calgary', 'Memory Express Calgary', 'Calgary', 'AB', 'CA', 51.0447, -114.0719),
  ('00000000-0000-4000-a000-000000000303', '00000000-0000-4000-a000-000000000104', 'me-edmonton', 'Memory Express Edmonton', 'Edmonton', 'AB', 'CA', 53.5461, -113.4938),
  ('00000000-0000-4000-a000-000000000304', '00000000-0000-4000-a000-000000000102', 'bb-yonge', 'Best Buy Toronto Eaton', 'Toronto', 'ON', 'CA', 43.6544, -79.3807),
  ('00000000-0000-4000-a000-000000000305', '00000000-0000-4000-a000-000000000102', 'bb-vancouver', 'Best Buy Vancouver Downtown', 'Vancouver', 'BC', 'CA', 49.2838, -123.1089)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO stores (id, retailer_id, slug, name, city, province_code, country_code, latitude, longitude) VALUES
  ('00000000-0000-4000-a000-000000000306', '00000000-0000-4000-a000-000000000103', 'cc-etobicoke', 'Canada Computers Etobicoke', 'Etobicoke', 'ON', 'CA', 43.6205, -79.5132),
  ('00000000-0000-4000-a000-000000000307', '00000000-0000-4000-a000-000000000103', 'cc-toronto-dt', 'Canada Computers Toronto Downtown', 'Toronto', 'ON', 'CA', 43.6544, -79.3807),
  ('00000000-0000-4000-a000-000000000308', '00000000-0000-4000-a000-000000000103', 'cc-north-york', 'Canada Computers North York Lawrence', 'North York', 'ON', 'CA', 43.7315, -79.4189),
  ('00000000-0000-4000-a000-000000000309', '00000000-0000-4000-a000-000000000103', 'cc-calgary', 'Canada Computers Calgary', 'Calgary', 'AB', 'CA', 51.0447, -114.0719),
  ('00000000-0000-4000-a000-000000000310', '00000000-0000-4000-a000-000000000103', 'cc-edmonton', 'Canada Computers Edmonton', 'Edmonton', 'AB', 'CA', 53.5461, -113.4938)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO cards (id, gpu_id, slug, brand, model_name, vram_gb, length_mm, slot_width, cooling, psu_watts, power_connector) VALUES
  ('00000000-0000-4000-a000-000000000200', '00000000-0000-4000-a000-000000000001', 'nvidia-5090-fe', 'NVIDIA', 'Founders Edition 32GB', 32, 342, 3.5, 'triple', 1000, '12V-2x6'),
  ('00000000-0000-4000-a000-000000000201', '00000000-0000-4000-a000-000000000001', 'asus-5090-tuf', 'ASUS', 'TUF Gaming OC', 32, 348, 3.5, 'triple', 1000, '12V-2x6'),
  ('00000000-0000-4000-a000-000000000202', '00000000-0000-4000-a000-000000000002', 'msi-5080-ventus', 'MSI', 'VENTUS 3X OC', 16, 306, 2.5, 'triple', 750, '12V-2x6'),
  ('00000000-0000-4000-a000-000000000203', '00000000-0000-4000-a000-000000000002', 'gigabyte-5080-windforce', 'Gigabyte', 'WINDFORCE OC', 16, 301, 2.5, 'triple', 750, '12V-2x6'),
  ('00000000-0000-4000-a000-000000000204', '00000000-0000-4000-a000-000000000003', 'pny-5070ti-xlr8', 'PNY', 'XLR8 Gaming VERTO OC', 16, 294, 2.5, 'triple', 750, '12V-2x6'),
  ('00000000-0000-4000-a000-000000000205', '00000000-0000-4000-a000-000000000003', 'msi-5070ti-ventus', 'MSI', 'VENTUS 2X OC', 16, 242, 2, 'dual', 650, '12V-2x6'),
  ('00000000-0000-4000-a000-000000000206', '00000000-0000-4000-a000-000000000004', 'zotac-5070-twin', 'ZOTAC', 'Twin Edge OC', 12, 224, 2, 'dual', 650, '8-pin'),
  ('00000000-0000-4000-a000-000000000207', '00000000-0000-4000-a000-000000000004', 'pny-5070-slim', 'PNY', 'Slim OC Dual-Fan', 12, 290, 2, 'dual', 650, '12V-2x6'),
  ('00000000-0000-4000-a000-000000000208', '00000000-0000-4000-a000-000000000005', 'asus-5060ti16-dual', 'ASUS', 'Dual OC 16GB', 16, 227, 2, 'dual', 550, '8-pin'),
  ('00000000-0000-4000-a000-000000000209', '00000000-0000-4000-a000-000000000006', 'msi-5060ti8-ventus', 'MSI', 'VENTUS 2X OC 8GB', 8, 205, 2, 'dual', 500, '8-pin'),
  ('00000000-0000-4000-a000-000000000210', '00000000-0000-4000-a000-000000000007', 'asus-5060-tuf', 'ASUS', 'TUF Gaming OC', 8, 221, 2, 'triple', 550, '8-pin'),
  ('00000000-0000-4000-a000-000000000211', '00000000-0000-4000-a000-000000000008', 'palit-5050-storm', 'Palit', 'StormX', 8, 170, 2, 'single', 450, '8-pin'),
  ('00000000-0000-4000-a000-000000000212', '00000000-0000-4000-a000-000000000009', 'pny-pro-5000', 'PNY', 'RTX PRO 5000', 48, 267, 2, 'blower', 650, '12V-2x6'),
  ('00000000-0000-4000-a000-000000000213', '00000000-0000-4000-a000-000000000010', 'nvidia-pro-4000', 'NVIDIA', 'RTX PRO 4000', 24, 267, 2, 'blower', 550, '12V-2x6'),
  ('00000000-0000-4000-a000-000000000214', '00000000-0000-4000-a000-000000000011', 'asus-4060-dual', 'ASUS', 'Dual OC', 8, 202, 2, 'dual', 450, '8-pin')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO province_taxes (province_code, province_name, tax_label, tax_rate) VALUES
  ('ON', 'Ontario', 'HST 13%', 0.13),
  ('BC', 'British Columbia', 'GST+PST 12%', 0.12),
  ('AB', 'Alberta', 'GST 5%', 0.05),
  ('QC', 'Quebec', 'GST+QST ~14.98%', 0.1498)
ON CONFLICT (province_code) DO NOTHING;

INSERT INTO listings (id, gpu_id, card_id, retailer_id, store_id, sku, product_url, brand, variant_label, condition, is_placeholder)
VALUES ('00000000-0000-4000-a000-000000000500', '00000000-0000-4000-a000-000000000004', '00000000-0000-4000-a000-000000000206', '00000000-0000-4000-a000-000000000102', '00000000-0000-4000-a000-000000000304', 'EX-BB-5070-ZT', 'https://example.invalid/bb/5070', 'ZOTAC', 'Twin Edge OC', 'new', true)
ON CONFLICT DO NOTHING;

INSERT INTO price_observations (listing_id, price_cad, in_stock, observed_at)
VALUES ('00000000-0000-4000-a000-000000000500', 829.99, true, '2026-11-23T08:00:00.000Z');

INSERT INTO price_observations (listing_id, price_cad, in_stock, observed_at)
VALUES ('00000000-0000-4000-a000-000000000500', 849.99, true, '2026-11-10T18:00:00.000Z');

INSERT INTO price_observations (listing_id, price_cad, in_stock, observed_at)
VALUES ('00000000-0000-4000-a000-000000000500', 839.99, false, '2026-11-15T18:00:00.000Z');

INSERT INTO listings (id, gpu_id, card_id, retailer_id, store_id, sku, product_url, brand, variant_label, condition, is_placeholder)
VALUES ('00000000-0000-4000-a000-000000000503', '00000000-0000-4000-a000-000000000004', '00000000-0000-4000-a000-000000000207', '00000000-0000-4000-a000-000000000104', '00000000-0000-4000-a000-000000000302', 'EX-ME-5070-SLIM', 'https://example.invalid/me/5070', 'PNY', 'Slim OC Dual-Fan', 'new', true)
ON CONFLICT DO NOTHING;

INSERT INTO price_observations (listing_id, price_cad, in_stock, observed_at)
VALUES ('00000000-0000-4000-a000-000000000503', 870, true, '2026-11-23T09:00:00.000Z');

INSERT INTO listings (id, gpu_id, card_id, retailer_id, store_id, sku, product_url, brand, variant_label, condition, is_placeholder)
VALUES ('00000000-0000-4000-a000-000000000504', '00000000-0000-4000-a000-000000000003', '00000000-0000-4000-a000-000000000204', '00000000-0000-4000-a000-000000000105', NULL, 'EX-NE-5070TI', 'https://example.invalid/ne/5070ti', 'PNY', 'XLR8 Gaming VERTO OC', 'new', true)
ON CONFLICT DO NOTHING;

INSERT INTO price_observations (listing_id, price_cad, in_stock, observed_at)
VALUES ('00000000-0000-4000-a000-000000000504', 1440, true, '2026-11-23T07:00:00.000Z');

INSERT INTO price_observations (listing_id, price_cad, in_stock, observed_at)
VALUES ('00000000-0000-4000-a000-000000000504', 1461, true, '2026-11-20T12:00:00.000Z');

INSERT INTO listings (id, gpu_id, card_id, retailer_id, store_id, sku, product_url, brand, variant_label, condition, is_placeholder)
VALUES ('00000000-0000-4000-a000-000000000506', '00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000202', '00000000-0000-4000-a000-000000000106', NULL, 'EX-AMZ-5080', 'https://example.invalid/amz/5080', 'MSI', 'VENTUS 3X OC', 'new', true)
ON CONFLICT DO NOTHING;

INSERT INTO price_observations (listing_id, price_cad, in_stock, observed_at)
VALUES ('00000000-0000-4000-a000-000000000506', 2348, true, '2026-11-23T06:00:00.000Z');

INSERT INTO listings (id, gpu_id, card_id, retailer_id, store_id, sku, product_url, brand, variant_label, condition, is_placeholder)
VALUES ('00000000-0000-4000-a000-000000000507', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000200', '00000000-0000-4000-a000-000000000105', NULL, 'EX-NE-5090', 'https://example.invalid/ne/5090', 'NVIDIA', 'Founders Edition 32GB', 'new', true)
ON CONFLICT DO NOTHING;

INSERT INTO price_observations (listing_id, price_cad, in_stock, observed_at)
VALUES ('00000000-0000-4000-a000-000000000507', 6450, true, '2026-11-23T05:00:00.000Z');

INSERT INTO listings (id, gpu_id, card_id, retailer_id, store_id, sku, product_url, brand, variant_label, condition, is_placeholder)
VALUES ('00000000-0000-4000-a000-000000000508', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000201', '00000000-0000-4000-a000-000000000110', NULL, 'EX-EB-5090', 'https://example.invalid/ebay/5090', 'ASUS', 'TUF Gaming OC', 'new', true)
ON CONFLICT DO NOTHING;

INSERT INTO price_observations (listing_id, price_cad, in_stock, observed_at)
VALUES ('00000000-0000-4000-a000-000000000508', 6500, true, '2026-11-22T20:00:00.000Z');

INSERT INTO listings (id, gpu_id, card_id, retailer_id, store_id, sku, product_url, brand, variant_label, condition, is_placeholder)
VALUES ('00000000-0000-4000-a000-000000000509', '00000000-0000-4000-a000-000000000007', '00000000-0000-4000-a000-000000000210', '00000000-0000-4000-a000-000000000104', '00000000-0000-4000-a000-000000000303', 'EX-ME-5060', 'https://example.invalid/me/5060', 'ASUS', 'TUF Gaming OC', 'new', true)
ON CONFLICT DO NOTHING;

INSERT INTO price_observations (listing_id, price_cad, in_stock, observed_at)
VALUES ('00000000-0000-4000-a000-000000000509', 490, true, '2026-11-23T04:00:00.000Z');

INSERT INTO listings (id, gpu_id, card_id, retailer_id, store_id, sku, product_url, brand, variant_label, condition, is_placeholder)
VALUES ('00000000-0000-4000-a000-000000000510', '00000000-0000-4000-a000-000000000006', '00000000-0000-4000-a000-000000000209', '00000000-0000-4000-a000-000000000109', NULL, 'EX-WM-5060TI8', 'https://example.invalid/wm/5060ti', 'MSI', 'VENTUS 2X OC 8GB', 'new', true)
ON CONFLICT DO NOTHING;

INSERT INTO price_observations (listing_id, price_cad, in_stock, observed_at)
VALUES ('00000000-0000-4000-a000-000000000510', 490, true, '2026-11-21T14:00:00.000Z');

INSERT INTO listings (id, gpu_id, card_id, retailer_id, store_id, sku, product_url, brand, variant_label, condition, is_placeholder)
VALUES ('00000000-0000-4000-a000-000000000511', '00000000-0000-4000-a000-000000000008', '00000000-0000-4000-a000-000000000211', '00000000-0000-4000-a000-000000000108', NULL, 'EX-ST-5050', 'https://example.invalid/st/5050', 'Palit', 'StormX', 'new', true)
ON CONFLICT DO NOTHING;

INSERT INTO price_observations (listing_id, price_cad, in_stock, observed_at)
VALUES ('00000000-0000-4000-a000-000000000511', 390, true, '2026-11-22T11:00:00.000Z');

INSERT INTO listings (id, gpu_id, card_id, retailer_id, store_id, sku, product_url, brand, variant_label, condition, is_placeholder)
VALUES ('00000000-0000-4000-a000-000000000512', '00000000-0000-4000-a000-000000000011', '00000000-0000-4000-a000-000000000214', '00000000-0000-4000-a000-000000000107', NULL, 'EX-VI-4060', 'https://example.invalid/vi/4060', 'ASUS', 'Dual OC', 'new', true)
ON CONFLICT DO NOTHING;

INSERT INTO price_observations (listing_id, price_cad, in_stock, observed_at)
VALUES ('00000000-0000-4000-a000-000000000512', 400, true, '2026-11-19T16:00:00.000Z');

INSERT INTO listings (id, gpu_id, card_id, retailer_id, store_id, sku, product_url, brand, variant_label, condition, is_placeholder)
VALUES ('00000000-0000-4000-a000-000000000513', '00000000-0000-4000-a000-000000000009', '00000000-0000-4000-a000-000000000212', '00000000-0000-4000-a000-000000000105', NULL, 'EX-NE-PRO5K', 'https://example.invalid/ne/pro5000', 'PNY', 'RTX PRO 5000', 'new', true)
ON CONFLICT DO NOTHING;

INSERT INTO price_observations (listing_id, price_cad, in_stock, observed_at)
VALUES ('00000000-0000-4000-a000-000000000513', 7900, true, '2026-11-18T10:00:00.000Z');

INSERT INTO listings (id, gpu_id, card_id, retailer_id, store_id, sku, product_url, brand, variant_label, condition, is_placeholder)
VALUES ('00000000-0000-4000-a000-000000000514', '00000000-0000-4000-a000-000000000010', '00000000-0000-4000-a000-000000000213', '00000000-0000-4000-a000-000000000104', '00000000-0000-4000-a000-000000000302', 'EX-ME-PRO4K', 'https://example.invalid/me/pro4000', 'NVIDIA', 'RTX PRO 4000', 'new', true)
ON CONFLICT DO NOTHING;

INSERT INTO price_observations (listing_id, price_cad, in_stock, observed_at)
VALUES ('00000000-0000-4000-a000-000000000514', 2200, true, '2026-11-17T09:00:00.000Z');

INSERT INTO listings (id, gpu_id, card_id, retailer_id, store_id, sku, product_url, brand, variant_label, condition, is_placeholder)
VALUES ('00000000-0000-4000-a000-000000000515', '00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000203', '00000000-0000-4000-a000-000000000102', '00000000-0000-4000-a000-000000000305', 'EX-BB-5080-OB', 'https://example.invalid/bb/5080-ob', 'Gigabyte', 'WINDFORCE OC', 'open_box', true)
ON CONFLICT DO NOTHING;

INSERT INTO price_observations (listing_id, price_cad, in_stock, observed_at)
VALUES ('00000000-0000-4000-a000-000000000515', 1849, true, '2026-11-21T13:00:00.000Z');
