-- Table for search documents (single-table, denormalized)
CREATE TABLE search_documents (
  product_id UUID PRIMARY KEY,
  name TEXT,
  description TEXT,
  brand TEXT,
  category_paths TEXT[],
  tags TEXT[],
  min_price NUMERIC(10,2),
  max_price NUMERIC(10,2),
  embedding VECTOR(768),
  in_stock BOOLEAN,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for attribute filters (faceted search)
CREATE TABLE search_document_filters (
  id SERIAL PRIMARY KEY,
  product_id UUID REFERENCES search_documents(product_id) ON DELETE CASCADE,
  attribute_name TEXT NOT NULL,
  value TEXT NOT NULL
);

-- Indexes for fast filtering
CREATE INDEX idx_search_documents_category_paths ON search_documents USING GIN (category_paths);
CREATE INDEX idx_search_documents_tags ON search_documents USING GIN (tags);
CREATE INDEX idx_search_document_filters_name_value ON search_document_filters (attribute_name, value);
