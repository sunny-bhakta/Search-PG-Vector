-- ========================================================================
-- Function: search_lexical_fts(query TEXT, k INT)
-- Description: Full-text search on 'products' table using PostgreSQL FTS.
-- Returns: TABLE (id uuid, lexical_score REAL)
-- Usage: SELECT * FROM search_lexical_fts('example search', 10);
-- ========================================================================
CREATE OR REPLACE FUNCTION search_lexical_fts(
    query TEXT,
    k INT
)
RETURNS TABLE (
    id uuid,
    lexical_score REAL
) AS $$
BEGIN
    RETURN QUERY
        SELECT
            products.id, -- UUID of the matching product
            ts_rank(search_vector, plainto_tsquery(query)) AS lexical_score -- Relevance score
        FROM products
        WHERE search_vector @@ plainto_tsquery(query) -- FTS match
        ORDER BY lexical_score DESC -- Highest relevance first
        LIMIT k; -- Limit to top k results
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- Function: search_lexical_trigram_similarity(query TEXT, k INT)
-- Description: Trigram similarity search on 'products' table titles.
-- Returns: TABLE (id uuid, similarity REAL)
-- Usage: SELECT * FROM search_lexical_trigram_similarity('example', 10);
-- ========================================================================
CREATE OR REPLACE FUNCTION search_lexical_trigram_similarity(
    query TEXT,
    k INT
)
RETURNS TABLE (
    id uuid,
    trigram_score REAL
) AS $$
BEGIN
    RETURN QUERY
        SELECT
            products.id, -- UUID of the product
            similarity(name, query) AS trigram_score -- Trigram similarity score
        FROM products
        WHERE name % query -- Trigram match
        ORDER BY trigram_score DESC -- Highest similarity first
        LIMIT k; -- Limit to top k results
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- Function: search_semantic_vector_similarity(query_embedding VECTOR, k INT)
-- Description: Semantic vector search using embedding similarity.
-- Returns: TABLE (id uuid, semantic_score REAL)
-- Usage: SELECT * FROM search_semantic_vector_similarity(<embedding>, 10);
-- ========================================================================
CREATE OR REPLACE FUNCTION search_semantic_vector_similarity(
    query_embedding VECTOR,
    k INT
)
RETURNS TABLE (
    id uuid,
    semantic_score REAL
) AS $$
BEGIN
    RETURN QUERY
        SELECT
            products.id, -- UUID of the product
            (1 - (embedding <=> query_embedding))::REAL AS semantic_score -- Similarity score (higher is better)
        FROM products
        ORDER BY embedding <=> query_embedding -- Closest vectors first
        LIMIT k; -- Limit to top k results
END;
$$ LANGUAGE plpgsql;
