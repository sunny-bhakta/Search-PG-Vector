
# Search To-Do List

## Features & Enhancements
- [ ] Spell correction
- [ ] Synonyms dictionary
- [ ] Multi-language search
- [ ] Personalized ranking
- [ ] A/B testing search relevance
- [ ] Designed ranking and relevance system
- [ ] Hybrid score fusion query
- [ ] Filter + sort query
- [ ] Autocomplete query
- [ ] Full-text ranking query
- [ ] Business Ranking Layer
- [ ] In-stock boost
- [ ] Rating boost
- [ ] Price buckets
- [ ] Sponsored products
- [ ] EXPLAIN ANALYZE → Raw SQL
- [ ] Faceting
- [ ] Query expansion
- [ ] If zero results → trigram fallback
- [ ] Suggest “Did you mean…"
- [ ] tsvector → keyword relevance
- [ ] pgvector → semantic meaning
- [ ] pg_trgm → typo tolerance
- [ ] Category-based synonyms
- [ ] AI-generated synonyms
- [ ] Search analytics → auto-suggest synonyms
- [ ] Weighted synonym boosting
- [ ] Relevance tuning strategy
- [ ] How to make this portfolio-worthy
- [ ] ANN search
- [ ] Filters (price, stock, brand)
- [ ] Sale pricing
- [ ] Full sync worker from primary DB
- [ ] Better vector + hybrid ranking
- [ ] Pagination + sorting
- [ ] Ranking logic
- [ ] Business boosts
- [ ] Transactions
- [ ] Merchandise
- [ ] Add read replicas
- [ ] Tune HNSW
- [ ] Partition
- [ ] Consider external vector DB

## Achievements
- ✔️ Search works like a real ecommerce system
- ✔️ Supports categories + subcategories
- ✔️ Supports variants (color/size/price/stock)
- ✔️ Filters, ranking, facets
- ✔️ Works without Elasticsearch
- ✔️ Easy to migrate to ES later

## Next Steps (I can provide)
If you want, I can generate:
1. Full SQL migration script
2. Node + Express search endpoint
3. Indexing worker (queue-based)
4. Query builder for filters

---

## Search Microservice: Full Schema (Postgres)

### Table: search_products
This is your search index table.

```sql
CREATE TABLE search_products (
  product_id      BIGINT PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT,
  brand           TEXT,
  created_at      TIMESTAMPTZ NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL,
  -- category + subcategory support
  category_id     BIGINT NOT NULL,
  category_path   BIGINT[] NOT NULL,   -- includes parent category IDs
  category_names  TEXT[],
  -- variant support
  min_price       NUMERIC(10,2),
  max_price       NUMERIC(10,2),
  in_stock        BOOLEAN NOT NULL DEFAULT FALSE,
  variants        JSONB,               -- variant list
  -- full-text search
  search_vector   TSVECTOR
);
```

### Indexes for Fast Search
```sql
-- Full-text search index
CREATE INDEX idx_search_products_fts
  ON search_products USING GIN (search_vector);
-- Category filter index
CREATE INDEX idx_search_products_category
  ON search_products USING GIN (category_path);
-- Price filter index
CREATE INDEX idx_search_products_price
  ON search_products (min_price, max_price);
-- Variant index (optional but recommended)
CREATE INDEX idx_search_products_variants
  ON search_products USING GIN (variants);
```

### Populate search_vector (weighted search)
```sql
UPDATE search_products
SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B');
```

### Search Query Examples

**1) Full-text search + category filter + price filter**
```sql
SELECT
  product_id,
  title,
  brand,
  min_price,
  max_price,
  in_stock,
  ts_rank(search_vector, to_tsquery('iphone')) AS rank
FROM search_products
WHERE search_vector @@ to_tsquery('iphone')
  AND category_path @> ARRAY[2]          -- subcategory or category filter
  AND min_price >= 500
  AND max_price <= 1000
  AND in_stock = true
ORDER BY rank DESC
LIMIT 20;
```

**2) Faceting (category counts)**
```sql
SELECT category_id, COUNT(*)
FROM search_products
GROUP BY category_id
ORDER BY COUNT(*) DESC;
```

**3) Variant filtering (color + size)**
```sql
SELECT *
FROM search_products
WHERE variants @> '[{"attributes": {"color": "red", "size": "M"}}]';
```

**4) Autocomplete (typeahead)**
```sql
SELECT title
FROM search_products
WHERE title ILIKE 'iph%'
ORDER BY similarity(title, 'iph') DESC
LIMIT 10;
```

## Already Implemented
- [x] Basic search with text similarity (pg_trgm, similarity(name, $1))
- [x] Faceted filtering (attribute filters via /search?filters=...)
- [x] In-stock filtering
- [x] Express search endpoint
- [x] Parameterized queries for safety
- [x] Basic result ranking (by similarity score)
- [x] Filter + sort query (partial: only by similarity, not by other fields)
- [x] Pagination (partial: hardcoded LIMIT 50, but no offset/page support)
- [x] Full-text ranking query (partial, using similarity not tsvector)
- [x] Faceting (partial, but not with counts)
- [x] Works without Elasticsearch

## High-Impact Features to Implement Next
- [x] Hybrid Score Fusion Query  
  Combine text (lexical) and vector (semantic) search for better relevance.  
  Use a pattern like your earlier `search_semantic` + `search_lexical` CTEs.
- [x] Full-Text Search (tsvector)  
  Add a `search_vector` column and use `to_tsvector`/`to_tsquery` for more robust keyword search.  
  Enables typo tolerance, stemming, and better ranking.
- [ ] Faceting with Counts  
  Return counts for each filter (e.g., color, size) for faceted navigation.
- [ ] Pagination & Sorting  
  Add support for page, limit, and sort query params.
- [ ] Autocomplete Query  
  Implement a `/autocomplete` endpoint using ILIKE and similarity.
- [ ] Spell Correction & Synonyms  
  Suggest corrections or synonyms if no results are found.
- [ ] Business Ranking Layer  
  Add boosts for in-stock, rating, price buckets, sponsored products, etc.
- [ ] Query Expansion / “Did you mean…”  
  Suggest alternative queries if results are low.
- [ ] Search Analytics  
  Track queries and clicks for future improvements.

## Quick Wins
- [ ] Add ORDER BY options (price, newest, etc.).
- [ ] Add OFFSET for pagination.
- [ ] Add tsvector-based search for better full-text support.
- [ ] Add a /facets endpoint for filter counts.

Would you like a step-by-step plan or code for any of these next features? Let me know your priority!
