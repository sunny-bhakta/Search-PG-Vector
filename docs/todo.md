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
- [x] Category-based synonyms
- [ ] Add tsvector-based search for better full-text support.
- [ ] Add ORDER BY options (price, newest, etc.)
- [ ] ANN search-
- [ ] Tune HNSW

### Incomplete
- [ ] Multi-language search  
Enable search functionality across multiple languages.  
This involves handling language-specific tokenization, stemming, and ranking to ensure relevant results for users searching in different languages.  
Consider using PostgreSQL's built-in support for multiple text search configurations or integrating external libraries for advanced language support.

- [ ] Partitioning (PostgreSQL Table Partitioning)

Partitioning means splitting a large table into smaller, more manageable pieces (partitions) based on a key (e.g., date, category, id range). This can improve query performance and maintenance.

**How to implement:**
1. Choose a partition key (e.g., created_at for time-based, category_id for category-based).
2. Alter your main table to become a partitioned table:
  ```sql
  ALTER TABLE products PARTITION BY RANGE (created_at);
  ```
3. Create partitions:
  ```sql
  CREATE TABLE products_2024 PARTITION OF products FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
  ```
4. Update your application to ensure inserts go to the parent table (Postgres routes them automatically).
5. Monitor and maintain partitions (e.g., add new ones as needed).

**Benefits:**  
- Faster queries on partitioned columns  
- Easier data archiving and purging  
- Improved maintenance for large datasets

**Docs:**  
- [PostgreSQL Partitioning Guide](https://www.postgresql.org/docs/current/ddl-partitioning.html)

- [ ] EXPLAIN ANALYZE → Raw SQL- 
EXPLAIN ANALYZE → Raw SQL means:

Use the PostgreSQL EXPLAIN ANALYZE command to analyze and understand the performance of your raw SQL queries.
This command shows you the query plan, how indexes are used, and where time is spent in your query.
It helps you optimize your SQL for speed and efficiency.
How to use:

Take your actual SQL query (the "raw SQL" your app runs).
Run it in your database with EXPLAIN ANALYZE in front:
Review the output to see which parts are slow, if indexes are used, and where you can improv


- [ ] AI-generated synonyms
AI-generated synonyms means using an AI model (like OpenAI GPT, Azure OpenAI, or similar) to automatically generate synonyms for search terms, instead of (or in addition to) manually curating a synonyms list.

- [ ] A/B testing search relevance
- [ ] analytics, A/B testing, continuous improvement
- [ ] Search analytics → auto-suggest synonym
- [ ] Relevance tuning strategy
- [ ] Testing and measuring search quality (e.g., click-through, conversions)
- [ ] Query Expansion / “Did you mean…”
- [ ]  Suggest alternative queries if results are low.
- [ ]  Track queries and clicks for future improvements.




- Analytics

Log every search query, filters, and user actions (clicks, conversions) to a database table (e.g., search_logs).
Store: query, filters, timestamp, user/session id, clicked product id, etc.
Build dashboards (using Grafana, Metabase, or simple SQL) to visualize:
Top queries, no-result queries, click-through rates, conversion rates.
Use this data to identify gaps (e.g., queries with low/no results).
A/B Testing

Implement two (or more) ranking strategies (e.g., different weights, boosts, or synonym logic).
Randomly assign users or sessions to a group (A or B) and serve different ranking logic.
Log which group each user/session is in and their actions.
After collecting enough data, compare metrics (CTR, conversions) between groups to see which strategy performs better.
Continuous Improvement

Regularly review analytics and A/B test results.
Adjust ranking weights, boosts, or synonym logic based on findings.
Add new synonyms, tune ANN/HNSW parameters, or improve query expansion as needed.
Repeat the process: deploy changes, measure, and refine.



- [ ] Full sync worker from primary DB
- [ ] Consider external vector DB
- [ ] Add read replicas
- [ ] How to make this portfolio-worthy
- [ ]pagination with count
