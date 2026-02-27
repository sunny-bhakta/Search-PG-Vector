# Search System: Features & Roadmap

## Table of Contents

1. [Overview](#overview)
2. [Completed Features](#completed-features)
    - [Core Search Features](#core-search-features)
    - [Business & Ranking Enhancements](#business--ranking-enhancements)
    - [Filtering, Faceting, and Fallbacks](#filtering-faceting-and-fallbacks)
3. [Planned / Upcoming Features](#planned--upcoming-features)
    - [Multi-language Search](#multi-language-search)
    - [Partitioning](#partitioning)
    - [Query Analysis](#query-analysis)
    - [AI & Analytics](#ai--analytics)
    - [Analytics & Experimentation](#analytics--experimentation)
    - [Infrastructure](#infrastructure)
4. [References](#references)

---

## Overview

This document outlines the features, enhancements, and roadmap for the production-ready search system built with PostgreSQL and Node.js. It covers core search capabilities, business logic, analytics, and infrastructure considerations.

---

## Completed Features

### Core Search Features

- **Spell Correction**  
  Corrects user typos in queries.  
  _Implemented in:_ `spellSuggest.js`  
  ```js
  import { correctSpelling } from './utils/spellSuggest.js';
  const corrected = await correctSpelling('denimm'); // returns 'denim'
  ```

- **Synonyms Dictionary**  
  Expands queries with synonyms for better recall.  
  _Implemented in:_ `category_synomys.js`  
  ```js
  import { expandQueryWithCategorySynonyms } from './utils/category_synomys.js';
  const expanded = await expandQueryWithCategorySynonyms('denim', 'jeans'); // ['denim', 'jeans']
  ```

- **Personalized Ranking**  
  Adjusts ranking based on user profile/preferences.  
  _Implemented in:_ `searchService.js`  
  ```js
  // Example: Add user boost in blended_score
  + (CASE WHEN p.user_id = $userId THEN 0.2 ELSE 0 END)
  ```

- **Custom Ranking & Relevance System**  
  Blends multiple signals for scoring.  
  _Implemented in:_ `searchService.js`  
  ```sql
  COALESCE(ft.lexical_score, 0) * 0.4 + COALESCE(trgm.trigram_score, 0) * 0.2 + COALESCE(semantic.semantic_score, 0) * 0.4
  ```

- **Hybrid Score Fusion**  
  Combines lexical, trigram, and semantic scores.  
  _Implemented in:_ `searchService.js`  
  ```sql
  WITH ft AS (...), trgm AS (...), semantic AS (...)
  SELECT ... blended_score ...
  ```

- **Filter & Sort**  
  Supports filtering and sorting by various fields.  
  _Implemented in:_ `searchService.js`  
  ```js
  const allowedSort = { price: 'p.min_price', name: 'p.name' };
  // ...
  ORDER BY ${sortField} ${sortDir}
  ```

- **Autocomplete**  
  Suggests completions as user types.  
  _Implemented in:_ `getAutocompleteSuggestions`  
  ```js
  const suggestions = await getAutocompleteSuggestions('jea', filters);
  ```

- **Full-Text Ranking**  
  Uses PostgreSQL full-text search for ranking.  
  _Implemented in:_ `searchService.js`  
  ```sql
  SELECT * FROM products WHERE search_vector @@ to_tsquery($1)
  ```

### Business & Ranking Enhancements

- **Business Ranking Layer**  
  Adds business-specific boosts (e.g., sponsored, in-stock).  
  _Implemented in:_ `searchService.js`  
  ```sql
  + (CASE WHEN p.is_sponsored THEN 0.2 ELSE 0 END)
  ```

- **In-Stock Boost**  
  Boosts products that are in stock.  
  _Implemented in:_ `searchService.js`  
  ```sql
  + (CASE WHEN p.in_stock THEN 0.1 ELSE 0 END)
  ```

- **Rating Boost**  
  Boosts products with higher ratings.  
  _Implemented in:_ `searchService.js`  
  ```sql
  + (COALESCE(p.rating, 0) * 0.05)
  ```

- **Price Buckets**  
  Boosts based on price range.  
  _Implemented in:_ `searchService.js`  
  ```sql
  + (CASE WHEN p.price_bucket = 'low' THEN 0.02 ... END)
  ```

- **Sponsored Products**  
  Boosts sponsored products.  
  _Implemented in:_ `searchService.js`  
  ```sql
  + (CASE WHEN p.is_sponsored THEN 0.2 ELSE 0 END)
  ```

### Filtering, Faceting and Fallbacks

- **Faceting**  
  Returns available filters and counts.  
  _Implemented in:_ `getFacetsWithFilters`  
  ```js
  const facets = await getFacetsWithFilters(query, filters);
  ```

- **Zero Results → Trigram Fallback**  
  Falls back to trigram similarity if no results.  
  _Implemented in:_ `searchService.js`  
  ```sql
  SELECT ... FROM ... WHERE name % $1
  ```

- **tsvector for Keyword Relevance**  
  Uses tsvector for keyword search.  
  _Implemented in:_ `searchService.js`  
  ```sql
  search_vector @@ to_tsquery($1)
  ```

- **pgvector for Semantic Meaning**  
  Uses vector embeddings for semantic search.  
  _Implemented in:_ `searchService.js`  
  ```sql
  SELECT ... FROM ... WHERE embedding <#> $1
  ```

- **pg_trgm for Typo Tolerance**  
  Uses trigram similarity for typo tolerance.  
  _Implemented in:_ `searchService.js`  
  ```sql
  name % $1
  ```

- **Weighted Synonym Boosting**  
  Boosts results with synonyms.  
  _Implemented in:_ `category_synomys.js`, `searchService.js`

- **Filters (Price, Stock, Brand, etc.)**  
  Supports filtering by price, stock, brand, etc.  
  _Implemented in:_ `searchService.js`  
  ```js
  whereClauses.push(`p.brand = $${paramIndex}::text`);
  ```

- **Sale Pricing**  
  Handles sale price logic.  
  _Implemented in:_ `searchService.js`  
  ```sql
  CASE WHEN p.sale_price IS NOT NULL ... THEN p.sale_price ELSE p.min_price END AS display_price
  ```

- **Better Vector + Hybrid Ranking**  
  Improved blending of vector and lexical scores.  
  _Implemented in:_ `searchService.js`

- **Pagination & Sorting**  
  Supports pagination and sorting.  
  _Implemented in:_ `searchService.js`  
  ```js
  LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  ```

- **Ranking Logic**  
  Custom ranking formula.  
  _Implemented in:_ `searchService.js`

- **Business Boosts**  
  Additional business-specific ranking.  
  _Implemented in:_ `searchService.js`

- **Transactions**  
  Ensures DB consistency.  
  _Implemented in:_ All DB operations  
  ```js
  await client.query('BEGIN');
  // ...
  await client.query('COMMIT');
  ```

- **Merchandise Logic**  
  Handles merchandise-specific logic.  
  _Implemented in:_ `searchService.js`  
  ```sql
  + (COALESCE(p.merch_priority, 0) * 0.1) + (CASE WHEN p.is_featured THEN 0.3 ELSE 0 END)
  ```

- **Basic Search with Text Similarity**  
  Uses trigram similarity for basic search.  
  _Implemented in:_ `searchService.js`

- **Faceted Filtering**  
  Supports faceted filtering.  
  _Implemented in:_ `searchService.js`

- **In-Stock Filtering**  
  Filters out-of-stock products.  
  _Implemented in:_ `searchService.js`

- **Express Search Endpoint**  
  Exposes search API.  
  _Implemented in:_ `searchController.js`  
  ```js
  app.get('/api/search', searchController.search);
  ```

- **Parameterized Queries for Safety**  
  Prevents SQL injection.  
  _Implemented in:_ All queries  
  ```js
  pool.query('SELECT * FROM products WHERE id = $1', [id]);
  ```

- **Basic Result Ranking**  
  Ranks by similarity.  
  _Implemented in:_ `searchService.js`

- **Early Filter/Sort, Pagination, Faceting**  
  Partial implementations for filter/sort, pagination, and faceting.

- **Works without Elasticsearch**  
  Pure PostgreSQL/Node.js solution.

---

## Planned / Upcoming Features

### Multi-language Search

- [ ] Enable search across multiple languages (tokenization, stemming, ranking).  
    Consider PostgreSQL's multi-language FTS or external libraries.

### Partitioning

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
  - Faster queries on partitioned columns  
  - Easier data archiving/purging  
  - Improved maintenance

### Query Analysis

- [ ] **EXPLAIN ANALYZE → Raw SQL**  
    Use `EXPLAIN ANALYZE` to analyze and optimize SQL queries.

  **How to use:**
  - Run your SQL with `EXPLAIN ANALYZE` in your DB.
  - Review output for slow parts, index usage, and improvements.

### AI & Analytics

- [ ] **AI-generated Synonyms**  
    Use AI models to generate synonyms for search terms.

- [ ] **A/B Testing Search Relevance**  
    Test different ranking strategies and measure impact.
      
      **Example: A/B Testing Search Relevance**
      ```js
      // Assign user to experiment group
      const group = Math.random() < 0.5 ? 'A' : 'B';

      // Use different ranking logic based on group
      const rankingLogic = group === 'A' ? defaultRanking : experimentalRanking;

      // Log group assignment and results
      await db.query(
      'INSERT INTO ab_test_logs (user_id, group, query, clicked_product_id, timestamp) VALUES ($1, $2, $3, $4, NOW())',
      [userId, group, searchQuery, clickedProductId]
      );
      ```

- [ ] **Analytics, A/B Testing, Continuous Improvement**  
    Log queries, clicks, conversions.  
    Build dashboards (Grafana, Metabase, SQL).  
    Identify gaps and iterate.

  **What are Clicks and Conversions?**  
  - **Click:** When a user clicks on a search result (e.g., product link).
  - **Conversion:** When a user completes a desired action (e.g., purchase, add to cart) after searching.

  **Example: Logging Clicks and Conversions**
  ```js
  // Log a click event
  await db.query(
  'INSERT INTO search_logs (user_id, query, action, product_id, timestamp) VALUES ($1, $2, $3, $4, NOW())',
  [userId, searchQuery, 'click', productId]
  );

  // Log a conversion event
  await db.query(
  'INSERT INTO search_logs (user_id, query, action, product_id, timestamp) VALUES ($1, $2, $3, $4, NOW())',
  [userId, searchQuery, 'conversion', productId]
  );
  ```

### Analytics & Experimentation

- [ ] **Search Analytics → Auto-suggest Synonym**  
    Log every search query, filters, and user actions (clicks, conversions) to a database table (e.g., `search_logs`).  
    Store: query, filters, timestamp, user/session id, clicked product id, etc.  
    Build dashboards to visualize top queries, no-result queries, click-through rates, conversion rates.  
    Use this data to identify gaps.

- [ ] **Relevance Tuning Strategy**  
    Regularly review and tune ranking logic.

- [ ] **Testing and Measuring Search Quality**  
    Track click-through, conversions, etc.

- [ ] **Query Expansion / “Did you mean…”**  
    Suggest alternative queries if results are low.

### Infrastructure

- [ ] **Full Sync Worker from Primary DB**
- [ ] **Consider External Vector DB**
- [ ] **Add Read Replicas**
- [ ] **How to Make This Portfolio-worthy**

---

## References

- [PostgreSQL Partitioning Guide](https://www.postgresql.org/docs/current/ddl-partitioning.html)

---

**Note:**  
This document is intended for production use. Please review and update as features evolve.
