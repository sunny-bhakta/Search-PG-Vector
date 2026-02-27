-- Seed data for search_documents
INSERT INTO search_documents (
  product_id, name, description, brand, category_paths, tags, min_price, max_price, embedding, in_stock, updated_at
) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Slim Fit Jeans', 'Classic slim fit jeans with stretch fabric.', 'Levi''s', ARRAY['men/clothing/jeans'], ARRAY['stretch','premium'], 59.99, 79.99, NULL, true, NOW()),
  ('22222222-2222-2222-2222-222222222222', 'AirFlex Jogger', 'Tapered jogger with breathable four-way stretch fabric.', 'Lumen Athletics', ARRAY['apparel/mens/bottoms'], ARRAY['athleisure','stretch','travel'], 69.99, 89.99, NULL, true, NOW()),
  ('33333333-3333-3333-3333-333333333333', 'TrailLite Sneaker', 'Lightweight trail runner with Vibram outsole.', 'Northwind Outdoors', ARRAY['footwear/outdoors/mens'], ARRAY['trail','water-resistant','vibram'], 120.00, 140.00, NULL, false, NOW());

-- Seed data for search_document_filters
INSERT INTO search_document_filters (product_id, attribute_name, value) VALUES
  ('11111111-1111-1111-1111-111111111111', 'waist_size', '30'),
  ('11111111-1111-1111-1111-111111111111', 'waist_size', '32'),
  ('11111111-1111-1111-1111-111111111111', 'waist_size', '34'),
  ('11111111-1111-1111-1111-111111111111', 'color', 'blue'),
  ('11111111-1111-1111-1111-111111111111', 'color', 'black'),
  ('22222222-2222-2222-2222-222222222222', 'size', 'M'),
  ('22222222-2222-2222-2222-222222222222', 'size', 'L'),
  ('22222222-2222-2222-2222-222222222222', 'color', 'black'),
  ('33333333-3333-3333-3333-333333333333', 'size', '10'),
  ('33333333-3333-3333-3333-333333333333', 'color', 'olive');
