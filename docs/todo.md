
# Search To-Do List


## Features & Enhancements
- [ ] Spell correction
- [ ] Synonyms dictionary
- [ ] Multi-language search
- [ ] Personalized ranking
- [ ] A/B testing search relevance
- [ ] Designed ranking and relevance system
- [x] Hybrid score fusion query
- [x] Filter + sort query
- [ ] Autocomplete query
- [x] Full-text ranking query
- [ ] Business Ranking Layer
- [x] In-stock boost
- [ ] Rating boost
- [ ] Price buckets
- [ ] Sponsored products
- [ ] EXPLAIN ANALYZE → Raw SQL
- [x] Faceting
- [ ] Query expansion
- [x] If zero results → trigram fallback
- [ ] Suggest “Did you mean…"
- [x] tsvector → keyword relevance
- [x] pgvector → semantic meaning
- [x] pg_trgm → typo tolerance
- [ ] Category-based synonyms
- [ ] AI-generated synonyms
- [ ] Search analytics → auto-suggest synonyms
- [ ] Weighted synonym boosting
- [ ] Relevance tuning strategy
- [ ] How to make this portfolio-worthy
- [ ] ANN search
- [x] Filters (price, stock, brand)
- [ ] Sale pricing
- [ ] Full sync worker from primary DB
- [x] Better vector + hybrid ranking
- [ ] Pagination + sorting  ⬅️ **Next to pick**
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
- [x] Hybrid Score Fusion Query  
  Combine text (lexical) and vector (semantic) search for better relevance.  
  Use a pattern like your earlier `search_semantic` + `search_lexical` CTEs.
- [x] Full-Text Search (tsvector)  
  Add a `search_vector` column and use `to_tsvector`/`to_tsquery` for more robust keyword search.  
  Enables typo tolerance, stemming, and better ranking.
- [x] Faceting with Counts  
  Return counts for each filter (e.g., color, size) for faceted navigation.


## High-Impact Features to Implement Next
- [ ] Pagination & Sorting  ⬅️ **Next to pick**
  Add support for page, limit, and sort query params.
- [ ] Autocomplete Query
  Implement a `/autocomplete` endpoint using ILIKE and similarity.
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

Would you like a step-by-step plan or code for this feature? Let me know your priority!

