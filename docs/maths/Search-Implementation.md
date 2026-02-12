# Implementing Hybrid Search with pgvector

A practical recipe for wiring lexical + semantic retrieval in Postgres and exposing it through an Express API.

## 1. Define the data model

```sql
CREATE TABLE cproducts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    embedding VECTOR(768) NOT NULL,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_products_title_trgm
    ON products USING gin (title gin_trgm_ops);

CREATE INDEX idx_products_embedding
    ON products USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
```

- `gin_trgm_ops` accelerates fuzzy text search.
- `vector_cosine_ops` enables cosine-distance nearest neighbor search via pgvector.

## 2. Ingest products

```sql
INSERT INTO products (title, description, tags, embedding, metadata)
VALUES (
    'AirFlex Jogger',
    'Tapered jogger with four-way stretch, ideal for travel.',
    '{"athleisure","mens"}',
    $1::vector, -- embedding generated in application code
    '{"material":"cotton","color":"black"}'
);
```

Generate embeddings with your favorite model (e.g., `sentence-transformers/all-MiniLM-L6-v2`). Store them alongside structured attributes so SQL filters still work.

### Pseudo-code: embed + insert

```
function ingestProduct(product):
  text = product.title + " " + product.description
  # optionally include bullet specs, highlights, etc.
  embedding = embeddingModel.embed(text)      # returns 768-d vector

  sql = """
    INSERT INTO products (title, description, tags, embedding, metadata)
    VALUES ($1, $2, $3, $4::vector, $5)
    ON CONFLICT (id) DO UPDATE
    SET title = EXCLUDED.title,
      description = EXCLUDED.description,
      tags = EXCLUDED.tags,
      embedding = EXCLUDED.embedding,
      metadata = EXCLUDED.metadata;
  """

  params = [product.title,
        product.description,
        product.tags,
        embedding,
        product.metadata]

  db.execute(sql, params)

for product in catalogFeed:
  ingestProduct(product)
```

### Example embedding helper (Node.js + HuggingFace Inference API)

```js
import fetch from 'node-fetch';

const HF_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
const HF_TOKEN = process.env.HF_TOKEN;

export async function embedText(text) {
  const response = await fetch(
    `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: text })
    }
  );

  if (!response.ok) {
    throw new Error(`HF error: ${response.status} ${await response.text()}`);
  }

  const vectors = await response.json();
  // API returns [ [768 floats] ]; flatten and ensure Float32Array
  return Float32Array.from(vectors[0]);
}
```

Swap in OpenAI, Cohere, or a self-hosted model by replacing the fetch call; the rest of the pipeline stays identical as long as you return a 768-dim Float32Array.

**What text should you embed?**

| Field | Embed? | Notes |
|-------|--------|-------|
| Title | ✅ Always | Short but carries the key intent words shoppers type. |
| Description / marketing copy | ✅ Usually | Gives the model more semantic clues; keep it concise (≤500 tokens). |
| Bullet specs (size chart, material) | ✅ When relevant | Concatenate top bullets so factual queries ("machine washable?") hit. |
| SKU, price, inventory numbers | ❌ Typically no | Structured filters handle these better; including them can confuse similarity. |
| Reviews / UGC | ⚠️ Optional | Only embed if you want sentiment-style answers; otherwise index separately. |

Rule of thumb: embed any human-readable text that helps describe meaning; skip purely numeric or rapidly changing fields (price) and instead rely on SQL filters.

## 3. Lexical search helper (Postgres function)

```sql
CREATE OR REPLACE FUNCTION search_lexical(query text, k int)
RETURNS TABLE(id uuid, lexical_score real) AS $$
    SELECT id,
           similarity(title, query) AS lexical_score
    FROM products
    WHERE title % query
    ORDER BY lexical_score DESC
    LIMIT k;
$$ LANGUAGE sql STABLE;
```

## 4. Semantic search helper

```sql
CREATE OR REPLACE FUNCTION search_semantic(query_embedding vector, k int)
RETURNS TABLE(id uuid, semantic_score real) AS $$
    SELECT id,
           1 - (embedding <=> query_embedding) AS semantic_score
    FROM products
    ORDER BY embedding <-> query_embedding
    LIMIT k;
$$ LANGUAGE sql STABLE;
```

## 5. Combine the signals

```sql
WITH lexical AS (
    SELECT * FROM search_lexical($1, 50)
), semantic AS (
    SELECT * FROM search_semantic($2::vector, 50)
)
SELECT p.id,
       p.title,
       COALESCE(l.lexical_score, 0) AS lexical_score,
       COALESCE(s.semantic_score, 0) AS semantic_score,
       (0.3 * COALESCE(l.lexical_score, 0) +
        0.7 * COALESCE(s.semantic_score, 0)) AS blended_score
FROM products p
LEFT JOIN lexical  l ON p.id = l.id
LEFT JOIN semantic s ON p.id = s.id
WHERE l.id IS NOT NULL OR s.id IS NOT NULL
ORDER BY blended_score DESC
LIMIT 10;
```

Tune the blend weights to favor precision (higher lexical weight) or recall/semantics (higher vector weight).

## 6. Express route example

```js
import { Router } from 'express';
import { pool } from '../config/db.js';
import { embedText } from '../services/embeddings.js';

const router = Router();

router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });

  const embedding = await embedText(q); // returns Float32Array length 768

  const { rows } = await pool.query(
    `WITH lexical AS (
       SELECT * FROM search_lexical($1, 50)
     ), semantic AS (
       SELECT * FROM search_semantic($2::vector, 50)
     )
     SELECT p.id, p.title, blended_score
     FROM (
       SELECT p.id,
              0.3 * COALESCE(l.lexical_score, 0) +
              0.7 * COALESCE(s.semantic_score, 0) AS blended_score
       FROM products p
       LEFT JOIN lexical  l ON p.id = l.id
       LEFT JOIN semantic s ON p.id = s.id
       WHERE l.id IS NOT NULL OR s.id IS NOT NULL
       ORDER BY blended_score DESC
       LIMIT 10
     ) AS p
     ORDER BY blended_score DESC;`,
    [q, embedding]
  );

  res.json(rows);
});

export default router;
```

### Pseudo-code: query flow

```
function search(query):
  if query is empty:
    return []

  queryEmbedding = embeddingModel.embed(query)

  lexicalRows = db.callFunction("search_lexical", query, 50)
  semanticRows = db.callFunction("search_semantic", queryEmbedding, 50)

  combined = mergeOnId(lexicalRows, semanticRows)

  for row in combined:
    row.blended = 0.3 * row.lexicalScore + 0.7 * row.semanticScore

  sorted = sortBy(combined, key = row.blended, descending = True)

  return take(sorted, 10)
```

## 7. Quality checklist

| Step | What to monitor | Tool |
|------|-----------------|------|
| Index health | `REINDEX`, `ANALYZE`, `EXPLAIN` | psql dashboards |
| Embedding drift | cosine similarity histograms | Python notebook |
| Retrieval quality | Precision/Recall, MRR | labelled query set |
| Latency | P95 for `/search` | APM (Grafana, Datadog, etc.) |

## 8. Next steps

- Add a reranker (cross-encoder or LLM) before sending results to downstream systems.
- Cache frequent queries + embeddings (Redis) to avoid recomputation.
- Periodically vacuum/analyze to keep IVFFLAT stats current.
