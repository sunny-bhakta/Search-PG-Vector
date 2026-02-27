CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING GIN (search_vector);

-- Trigram similarity search: Creates a GIN index on the 'name' column using trigram operations for fast fuzzy text matching.
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_embedding ON products USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Filtering (for filters table): Uncomment to create indexes for filtering by product_id and attribute_name/value pairs.
-- CREATE INDEX IF NOT EXISTS idx_search_document_filters_product_id ON search_document_filters (product_id);
-- CREATE INDEX IF NOT EXISTS idx_search_document_filters_attr_val ON search_document_filters (attribute_name, value);

-- CREATE TABLE search_document_filters (
--   id SERIAL PRIMARY KEY,
--   product_id UUID REFERENCES search_documents(product_id) ON DELETE CASCADE,
--   attribute_name TEXT NOT NULL,
--   value TEXT NOT NULL
-- );

-- Indexes for fast filtering
-- CREATE INDEX idx_search_documents_category_paths ON search_documents USING GIN (category_paths);
-- CREATE INDEX idx_search_documents_tags ON search_documents USING GIN (tags);
CREATE INDEX idx_search_document_filters_name_value ON search_document_filters (attribute_name, value);
