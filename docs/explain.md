## Features & Enhancements

### Completed

#### Core Search Features

**Spell Correction**  
Corrects user typos in queries.  
_Implemented in:_ `spellSuggest.js` (used in search fallback logic).
```js
import { correctSpelling } from './utils/spellSuggest.js';
const corrected = await correctSpelling('denimm'); // returns 'denim'
```
**Synonyms Dictionary**  
Expands queries with synonyms for better recall.  
_Implemented in:_ `category_synomys.js` (used in `searchService.js`).
```js
import { expandQueryWithCategorySynonyms } from './utils/category_synomys.js';
const expanded = await expandQueryWithCategorySynonyms('denim', 'jeans'); // ['denim', 'jeans']
```

**Personalized Ranking**  
Adjusts ranking based on user profile/preferences.  
_Implemented in:_ ranking logic in `searchService.js`.
```js
// Example: Add user boost in blended_score
+ (CASE WHEN p.user_id = $userId THEN 0.2 ELSE 0 END)
```

**Custom Ranking & Relevance System**  
Blends multiple signals for scoring.  
_Implemented in:_ `searchService.js` (blended_score calculation).
```sql
COALESCE(ft.lexical_score, 0) * 0.4 + COALESCE(trgm.trigram_score, 0) * 0.2 + COALESCE(semantic.semantic_score, 0) * 0.4
```

**Hybrid Score Fusion**  
Combines lexical, trigram, and semantic scores.  
_Implemented in:_ `searchService.js` (CTEs and blended_score).
```sql
WITH ft AS (...), trgm AS (...), semantic AS (...)
SELECT ... blended_score ...
```

**Filter & Sort**  
Supports filtering and sorting by various fields.  
_Implemented in:_ `searchService.js` (whereClauses, allowedSort).
```js
const allowedSort = { price: 'p.min_price', name: 'p.name' };
// ...
ORDER BY ${sortField} ${sortDir}
```

**Autocomplete**  
Suggests completions as user types.  
_Implemented in:_ `getAutocompleteSuggestions` in `searchService.js`.
```js
const suggestions = await getAutocompleteSuggestions('jea', filters);
```

**Full-Text Ranking**  
Uses PostgreSQL full-text search for ranking.  
_Implemented in:_ `searchService.js` (fts CTE, tsvector usage).
```sql
SELECT * FROM products WHERE search_vector @@ to_tsquery($1)
```

#### Business & Ranking Enhancements

**Business Ranking Layer**  
Adds business-specific boosts (e.g., sponsored, in-stock).  
_Implemented in:_ `searchService.js` (blended_score).
```sql
+ (CASE WHEN p.is_sponsored THEN 0.2 ELSE 0 END)
```

**In-Stock Boost**  
Boosts products that are in stock.  
_Implemented in:_ `searchService.js` (blended_score).
```sql
+ (CASE WHEN p.in_stock THEN 0.1 ELSE 0 END)
```

**Rating Boost**  
Boosts products with higher ratings.  
_Implemented in:_ `searchService.js` (blended_score).
```sql
+ (COALESCE(p.rating, 0) * 0.05)
```

**Price Buckets**  
Boosts based on price range.  
_Implemented in:_ `searchService.js` (blended_score).
```sql
+ (CASE WHEN p.price_bucket = 'low' THEN 0.02 ... END)
```

**Sponsored Products**  
Boosts sponsored products.  
_Implemented in:_ `searchService.js` (blended_score).
```sql
+ (CASE WHEN p.is_sponsored THEN 0.2 ELSE 0 END)
```

#### Filtering, Faceting, and Fallbacks

**Faceting**  
Returns available filters and counts.  
_Implemented in:_ `getFacetsWithFilters` in `searchService.js`.
```js
const facets = await getFacetsWithFilters(query, filters);
```

**Zero Results → Trigram Fallback**  
Falls back to trigram similarity if no results.  
_Implemented in:_ `searchService.js` (trgm CTE, fallback logic).
```sql
SELECT ... FROM ... WHERE name % $1
```

**tsvector for Keyword Relevance**  
Uses tsvector for keyword search.  
_Implemented in:_ `searchService.js` (fts CTE).
```sql
search_vector @@ to_tsquery($1)
```

**pgvector for Semantic Meaning**  
Uses vector embeddings for semantic search.  
_Implemented in:_ `searchService.js` (semantic CTE).
```sql
SELECT ... FROM ... WHERE embedding <#> $1
```

**pg_trgm for Typo Tolerance**  
Uses trigram similarity for typo tolerance.  
_Implemented in:_ `searchService.js` (trgm CTE).
```sql
name % $1
```

**Weighted Synonym Boosting**  
Boosts results with synonyms.  
_Implemented in:_ `category_synomys.js`, `searchService.js`.
```js
// See expandQueryWithCategorySynonyms example above
```

**Filters (Price, Stock, Brand, etc.)**  
Supports filtering by price, stock, brand, etc.  
_Implemented in:_ `searchService.js` (whereClauses).
```js
whereClauses.push(`p.brand = $${paramIndex}::text`);
```

**Sale Pricing**  
Handles sale price logic.  
_Implemented in:_ `searchService.js` (display_price calculation).
```sql
CASE WHEN p.sale_price IS NOT NULL ... THEN p.sale_price ELSE p.min_price END AS display_price
```

**Better Vector + Hybrid Ranking**  
Improved blending of vector and lexical scores.  
_Implemented in:_ `searchService.js` (blended_score).
```sql
COALESCE(ft.lexical_score, 0) * 0.4 + ...
```

**Pagination & Sorting**  
Supports pagination and sorting.  
_Implemented in:_ `searchService.js` (limit, offset, allowedSort).
```js
LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
```

**Ranking Logic**  
Custom ranking formula.  
_Implemented in:_ `searchService.js` (blended_score).
```sql
-- See blended_score calculation above
```

**Business Boosts**  
Additional business-specific ranking.  
_Implemented in:_ `searchService.js` (blended_score).
```sql
-- See blended_score calculation above
```

**Transactions**  
Ensures DB consistency.  
_Implemented in:_ All DB operations in `searchService.js`.
```js
await client.query('BEGIN');
// ...
await client.query('COMMIT');
```

**Merchandise Logic**  
Handles merchandise-specific logic.  
_Implemented in:_ `searchService.js` (merch_priority, is_featured, etc.).
```sql
+ (COALESCE(p.merch_priority, 0) * 0.1) + (CASE WHEN p.is_featured THEN 0.3 ELSE 0 END)
```

**Basic Search with Text Similarity**  
Uses trigram similarity for basic search.  
_Implemented in:_ `searchService.js` (trgm CTE).
```sql
name % $1
```

**Faceted Filtering**  
Supports faceted filtering.  
_Implemented in:_ `searchService.js` (facetFilters logic).
```js
const facetFilters = filters.filter(f => ...);
```

**In-Stock Filtering**  
Filters out-of-stock products.  
_Implemented in:_ `searchService.js` (whereClauses).
```js
whereClauses.push('p.in_stock = true');
```

**Express Search Endpoint**  
Exposes search API.  
_Implemented in:_ `searchController.js`.
```js
app.get('/api/search', searchController.search);
```

**Parameterized Queries for Safety**  
Prevents SQL injection.  
_Implemented in:_ All queries in `searchService.js`.
```js
pool.query('SELECT * FROM products WHERE id = $1', [id]);
```

**Basic Result Ranking**  
Ranks by similarity.  
_Implemented in:_ `searchService.js` (blended_score).
```sql
ORDER BY blended_score DESC
```

**Early Filter/Sort, Pagination, Faceting**  
Partial implementations for filter/sort, pagination, and faceting.
```js
// See allowedSort, pagination, and facetFilters examples above
```

**Works without Elasticsearch**  
Pure PostgreSQL/Node.js solution.
```js
// No Elasticsearch dependency anywhere
```

**Hybrid Score Fusion Query**  
Combines text and vector search.
```sql
-- See CTEs and blended_score above
```

**Full-Text Search (tsvector)**  
Uses tsvector for FTS.
```sql
-- See fts CTE example above
```

**Faceting with Counts**  
Returns facet counts.
```js
// See getFacetsWithFilters example above
```

**Pagination & Sorting**  
Supports page, limit, sort.
```js
// See pagination and sorting example above
```

**Autocomplete Query**  
Suggests completions.
```js
// See getAutocompleteSuggestions example above
```

**Business Ranking**  
Business-specific boosts.
```sql
-- See blended_score calculation above
```

**Category-based Synonyms**  
Expands queries using category context.
```js
// See expandQueryWithCategorySynonyms example above
```

#### TODOs (Planned/Upcoming)

- [ ] Add tsvector-based search for better full-text support.
- [ ] Add ORDER BY options (price, newest, etc.)
- [ ] ANN search
- [ ] Tune HNSW

---

### Incomplete / Planned Features

#### Multi-language Search

- [ ] **Multi-language Search**  
  Enable search across multiple languages (tokenization, stemming, ranking).  
  Consider PostgreSQL's multi-language FTS or external libraries.

#### Partitioning

- [ ] **Partitioning (PostgreSQL Table Partitioning)**  
  Split large tables into partitions for performance and maintenance.

  **How to implement:**
  1. Choose a partition key (e.g., `created_at`).
  2. Alter main table:
      ```sql
      ALTER TABLE products PARTITION BY RANGE (created_at);
      ```
  3. Create partitions:
      ```sql
      CREATE TABLE products_2024 PARTITION OF products FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
      ```
  4. Insert via parent table (Postgres routes automatically).
  5. Monitor and maintain partitions.

  **Benefits:**  
  Faster queries on partitioned columns  
  Easier data archiving/purging  
  Improved maintenance

  **Docs:**  
  [PostgreSQL Partitioning Guide](https://www.postgresql.org/docs/current/ddl-partitioning.html)

#### Query Analysis

- [ ] **EXPLAIN ANALYZE → Raw SQL**  
  Use `EXPLAIN ANALYZE` to analyze and optimize SQL queries.

  **How to use:**
  - Run your SQL with `EXPLAIN ANALYZE` in your DB.
  - Review output for slow parts, index usage, and improvements.

#### AI & Analytics

- [ ] **AI-generated Synonyms**  
  Use AI models to generate synonyms for search terms.

- [ ] **A/B Testing Search Relevance**  
  Test different ranking strategies and measure impact.

- [ ] **Analytics, A/B Testing, Continuous Improvement**  
  Log queries, clicks, conversions.  
  Build dashboards (Grafana, Metabase, SQL).  
  Identify gaps and iterate.

- [ ] **Search Analytics → Auto-suggest Synonym**  
  Use analytics to suggest synonyms.

- [ ] **Relevance Tuning Strategy**  
  Regularly review and tune ranking logic.

- [ ] **Testing and Measuring Search Quality**  
  Track click-through, conversions, etc.

- [ ] **Query Expansion / “Did you mean…”**  
  Suggest alternative queries if results are low.

- [ ] **Track Queries and Clicks**  
  For future improvements.

#### Analytics & Experimentation

**Analytics**  
Log every search query, filters, and user actions (clicks, conversions) to a database table (e.g., `search_logs`).  
Store: query, filters, timestamp, user/session id, clicked product id, etc.  
Build dashboards to visualize top queries, no-result queries, click-through rates, conversion rates.  
Use this data to identify gaps.

**A/B Testing**  
Implement multiple ranking strategies.  
Randomly assign users/sessions to groups (A/B).  
Log group and actions.  
Compare metrics (CTR, conversions) to determine best strategy.

**Continuous Improvement**  
Review analytics and A/B test results.  
Adjust ranking, boosts, synonyms, ANN/HNSW parameters, and query expansion as needed.  
Repeat: deploy, measure, refine.

#### Infrastructure

- [ ] **Full Sync Worker from Primary DB**
- [ ] **Consider External Vector DB**
- [ ] **Add Read Replicas**
- [ ] **How to Make This Portfolio-worthy**

---

This list is a living document—features are added, improved, and refined continuously.
