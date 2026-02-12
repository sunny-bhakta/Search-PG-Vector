## PostgreSQL Essentials
- **Table design & data types:** Store products, variants, embeddings, and tags with the right types so search filters and pgvector comparisons Just Work.

	```sql
	CREATE TABLE products (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		title TEXT NOT NULL,
		tags TEXT[] DEFAULT '{}',
		embedding VECTOR(768),
		metadata JSONB DEFAULT '{}'
	);
	```

	| id (UUID) | title | tags | embedding (vector) | metadata (JSONB) |
	|-----------|-------|------|--------------------|------------------|
	| 5b8d...   | "AirFlex Jogger" | {"athleisure","mens"} | [0.12, -0.04, ...] | {"color":"black","material":"cotton"} |

	Each column shows how structured, array, vector, and JSON data coexist in a single row, letting you mix semantic search, tag filters, and flexible attributes without extra tables.

- **Indexes (B-tree / GIN / IVFFLAT):** B-tree (balanced tree) handles equality/range filters, GIN (Generalized Inverted Index) accelerates multi-value data (arrays/JSONB/trigrams), and IVFFLAT (Inverted File Flat) keeps vector similarities fast by clustering embeddings.

	**Example**
	```sql
	CREATE INDEX idx_products_title_trgm ON products USING gin (title gin_trgm_ops);

	CREATE INDEX idx_products_embedding ON products USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
	```
- **Transactions:** Keep catalog data consistent by writing related rows inside one transaction.

	*Example*
	```sql
	BEGIN;
		INSERT INTO products (id, title) VALUES ($1, $2);
		INSERT INTO variants (product_id, sku) VALUES ($1, $3);
	COMMIT;
	```
- **JSONB operators:** Filter flexible attributes without schema bloat (`@>` contains JSON, `->>` extracts text values). Use `@>` only when the JSON actually stores the key/value pair; it won't match `NULL` or missing keys. For existence checks combine the key operator (`?`) with `->>` and `IS NULL` / `IS NOT NULL`.

	*Example*
	```sql
	SELECT id
	FROM products
	WHERE metadata @> '{"material": "cotton"}'
		AND metadata->>'color' = 'black';

	-- key exists but value is null or missing
	SELECT id
	FROM products
	WHERE metadata ? 'restock_date'
		AND metadata->>'restock_date' IS NULL;
	```

	*Sample query + result*
	```sql
	SELECT id,
	       title,
	       metadata->>'color'   AS color,
	       metadata->>'material' AS material,
	       tags
	FROM products
	WHERE metadata @> '{"material": "cotton"}'
	  AND tags @> ARRAY['athleisure'];
	```

	| id (UUID) | title | color | material | tags |
	|-----------|-------|-------|----------|------|
	| 5b8d...   | AirFlex Jogger | black | cotton | {"athleisure","mens"} |

	This mirrors a real `SELECT ... WHERE` workflow: the SQL predicate narrows rows by JSON and array contents, and the result table helps you see exactly what columns come back for downstream code.


- **Extensions + EXPLAIN:** Enable search extensions and inspect query plans. Extensions are plug-in modules that ship extra data types, operators, or functions—turn them on once per database and every subsequent `CREATE TABLE` / query can rely on the new capabilities. Without `pgvector`, for example, the `VECTOR(768)` column type simply doesn't exist.

	| Extension | Adds | Why we care |
	|-----------|------|-------------|
	| `pgvector` | `vector` column type, `<=>`, `<->`, `ivfflat`/`hnsw` indexes | Store embeddings natively and run fast similarity search. |
	| `pg_trgm` | `similarity()`, `%` operator, trigram GIN/GiST ops | Lexical fuzzy search on `title` and other text columns. |
	| `pgcrypto` | `gen_random_uuid()` and crypto helpers | Generate UUID primary keys without an external service. |

	`EXPLAIN (ANALYZE)` shows how Postgres plans to run a query, so you can verify indexes are used and tune settings like `ivfflat.probes`.

	*Example*
	```sql
	CREATE EXTENSION IF NOT EXISTS pgvector;

	CREATE EXTENSION IF NOT EXISTS pg_trgm;

	EXPLAIN ANALYZE
	SELECT * FROM products
	WHERE similarity(title, 'jogger') > 0.2
	ORDER BY title <-> 'jogger'
	LIMIT 10;
	```
- **Extensions & vector ops:** Tune pgvector/trigram knobs for accuracy vs. latency. `pgvector`'s IVF (inverted file) index splits the embedding space into many "lists" (clusters). At query time Postgres decides how many of those lists to scan; more lists = better recall but more work. Two knobs you'll touch most:
	- `SET ivfflat.probes = N`: per-session override for how many clusters to probe (defaults to 1).
	- `ALTER INDEX ... SET (lists = M)`: one-time choice for how many clusters to create when building the index; treat it like the resolution of your vector grid.

	Vector similarity operators you'll see in queries:
	- `<=>` (cosine distance): returns a number between 0 and 2 where 0 means identical direction. Lower is better. Great when you want a metric that matches cosine similarity math.
	- `<->` (distance ordering operator): uses the distance metric declared on the index (cosine, inner product, or L2) and is optimized for `ORDER BY column <-> $vector`. Think of it as the "use the index" operator for nearest-neighbor sorting.

	Because many folks prefer "higher score = better", subtracting the cosine distance from `1` flips the `<=>` output into a similarity score while still letting the IVF index leverage `<->` during sorting.


	Think of it like searching for a misplaced shoe: scanning just one closet (`probes = 1`) is fast but risky; checking ten closets (`probes = 10`) takes longer yet almost guarantees you'll find it.

	*Example*
	```sql
	SET ivfflat.probes = 10; -- explore more clusters for higher recall
	SELECT id,
	       1 - (embedding <=> $1::vector) AS semantic_score,
	       embedding <-> $1::vector       AS raw_distance
	FROM products
	ORDER BY semantic_score DESC
	LIMIT 5;
	```

	*Sample output*
	| id (UUID) | title             | semantic_score | raw_distance |
	|-----------|-------------------|----------------|--------------|
	| 5b8d...   | AirFlex Jogger    | 0.92 | 0.08 |
	| 6c1a...   | FlexLite Jogger   | 0.89 | 0.11 |
	| 331f...   | Motion Taper Pant | 0.87 | 0.13 |
	| 44ac...   | Core Run Jogger   | 0.83 | 0.17 |
	| 9d02...   | Sunday Sweatpant  | 0.81 | 0.19 |

	Here `<=>` returns cosine distance (0 = identical direction, 2 = opposite); subtracting from `1` gives an intuitive "similarity" score where higher is better. The `<->` operator exposes the raw distance in case you want to combine it with other signals. Drop `ivfflat.probes` down to `2` and you'll often see fewer high-score matches—but the query returns almost instantly. Bump it to `20` when you need "best possible" answers, such as powering an offline re-ranking job.