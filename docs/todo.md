## Features & Enhancements

### Completed
- [x] Spell correction
- [x] Synonyms dictionary
- [x] Personalized ranking
- [x] Designed ranking and relevance system
- [x] Hybrid score fusion query
- [x] Filter + sort query
- [x] Autocomplete query
- [x] Full-text ranking query
- [x] Business Ranking Layer
- [x] In-stock boost
- [x] Rating boost
- [x] Price buckets
- [x] Sponsored products
- [x] Faceting
- [x] If zero results → trigram fallback
- [x] tsvector → keyword relevance
- [x] pgvector → semantic meaning
- [x] pg_trgm → typo tolerance
- [x] Weighted synonym boosting
- [x] Filters (price, stock, brand)
- [x] Sale pricing
- [x] Better vector + hybrid ranking
- [x] Pagination + sorting
- [x] Ranking logic
- [x] Business boosts
- [x] Transactions
- [x] Merchandise
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
- [x] Pagination & Sorting  
  Add support for page, limit, and sort query params.
- [x] Autocomplete Query  
  Implement a `/autocomplete` endpoint using ILIKE and similarity.
- [x] Business Ranking  
  Add boosts for in-stock, rating, price buckets, sponsored products, etc.

### Incomplete
- [ ] Multi-language search
- [ ] A/B testing search relevance
- [ ] EXPLAIN ANALYZE → Raw SQL
- [ ] Category-based synonyms
- [ ] AI-generated synonyms
- [ ] Search analytics → auto-suggest synonyms
- [ ] Relevance tuning strategy
- [ ] How to make this portfolio-worthy
- [ ] ANN search
- [ ] Full sync worker from primary DB
- [ ] Add read replicas
- [ ] Tune HNSW
- [ ] Partition
- [ ] Consider external vector DB
- [ ] Query Expansion / “Did you mean…”
  Suggest alternative queries if results are low.
  Track queries and clicks for future improvements.
- [ ] Add ORDER BY options (price, newest, etc.)
- [ ] Add tsvector-based search for better full-text support.
