
import { pool } from "./db.js";
import embedText from "./embedText.js";

// * http://localhost:3000/api/search?q=jeans&filters=brand:puma,minPrice:50,maxPrice:150,tags:denim|slim

export async function searchWithFilters(query, filters) {
    // console.log('Executing search with query:', query, 'and filters:', filters);

    const client = await pool.connect();

    let filterParams = [];
    let whereClauses = [];
    let joinFilter = '';
    let paramIndex = 3; // $1 = query, $2 = vector embedding

    try {
        await client.query("BEGIN");

        // -------------------------
        // Brand filter
        // -------------------------
        const brandObj = filters?.find(f => f.name === 'brand');
        if (brandObj?.value) {
            whereClauses.push(`p.brand = $${paramIndex}::text`);
            filterParams.push(brandObj.value);
            paramIndex++;
        }

        // -------------------------
        // Min price filter
        // -------------------------
        const minPriceObj = filters?.find(f => f.name === 'minPrice');
        if (minPriceObj?.value) {
            whereClauses.push(`p.min_price >= $${paramIndex}::numeric`);
            filterParams.push(Number(minPriceObj.value));
            paramIndex++;
        }

        // -------------------------
        // Max price filter
        // -------------------------
        const maxPriceObj = filters?.find(f => f.name === 'maxPrice');
        if (maxPriceObj?.value) {
            whereClauses.push(`p.max_price <= $${paramIndex}::numeric`);
            filterParams.push(Number(maxPriceObj.value));
            paramIndex++;
        }

        // -------------------------
        // Tags filter (text array overlap)
        // -------------------------
        const tagsObj = filters?.find(f => f.name === 'tags');
        if (tagsObj?.value) {
            const tagsArray = tagsObj.value
                .split('|')
                .map(tag => tag.trim())
                .filter(Boolean);

            if (tagsArray.length > 0) {
                whereClauses.push(`p.tags && $${paramIndex}::text[]`);
                filterParams.push(tagsArray);
                paramIndex++;
            }
        }

        // -------------------------
        // Facet filters
        // -------------------------
        const facetFilters = filters?.filter(f =>
            !['brand', 'minPrice', 'maxPrice', 'tags'].includes(f.name)
        );

        if (facetFilters?.length > 0) {
            let facetClauses = [];

            facetFilters.forEach(f => {
                if (!f.value) return;

                if (f.value.includes('|')) {
                    const values = f.value
                        .split('|')
                        .map(v => v.trim())
                        .filter(Boolean);

                    facetClauses.push(
                        `(attribute_name = $${paramIndex}::text 
                          AND value = ANY($${paramIndex + 1}::text[]))`
                    );

                    filterParams.push(f.name, values);
                    paramIndex += 2;
                } else {
                    facetClauses.push(
                        `(attribute_name = $${paramIndex}::text 
                          AND value = $${paramIndex + 1}::text)`
                    );

                    filterParams.push(f.name, f.value);
                    paramIndex += 2;
                }
            });

            if (facetClauses.length > 0) {
                joinFilter = `
                    JOIN (
                        SELECT product_id
                        FROM search_document_filters
                        WHERE ${facetClauses.join(' OR ')}
                        GROUP BY product_id
                        HAVING COUNT(*) = ${facetFilters.length}
                    ) AS f ON p.id = f.product_id
                `;
            }
        }

        // -------------------------
        // Main Search Query
        // -------------------------
        const sql = `
            WITH 
            ft AS (
                SELECT id::uuid, lexical_score 
                FROM search_lexical_fts($1, 50)
            ),
            trgm AS (
                SELECT id::uuid, trigram_score 
                FROM search_lexical_trigram_similarity($1, 50)
            ),
            semantic AS (
                SELECT id::uuid, semantic_score 
                FROM search_semantic_vector_similarity($2::vector, 50)
            )
            SELECT
                p.id,
                p.name,
                p.brand,
                p.min_price,
                p.max_price,
                p.tags,
                COALESCE(ft.lexical_score, 0) * 0.4 +
                COALESCE(trgm.trigram_score, 0) * 0.2 +
                COALESCE(semantic.semantic_score, 0) * 0.4 AS blended_score
            FROM products p
            LEFT JOIN ft ON p.id = ft.id
            LEFT JOIN trgm ON p.id = trgm.id
            LEFT JOIN semantic ON p.id = semantic.id
            ${joinFilter}
            WHERE 
                (ft.id IS NOT NULL 
                OR trgm.id IS NOT NULL 
                OR semantic.id IS NOT NULL)
                ${whereClauses.length ? 'AND ' + whereClauses.join(' AND ') : ''}
            ORDER BY blended_score DESC
            LIMIT 20
        `;

        // -------------------------
        // Embed Query Text
        // -------------------------
        const vectArr = await embedText(query);
        const vectEmb = Array.isArray(vectArr)
            ? `[${vectArr.join(',')}]`
            : vectArr;

        const finalParams = [query, vectEmb, ...filterParams];

        // Debug safety (optional)
        // console.log(sql);
        // console.log(finalParams);

        const { rows } = await client.query(sql, finalParams);

        await client.query("COMMIT");
        return rows;

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

// todo update
// Facet-aware, filter-contextual faceting function
export async function getFacetsWithFilters(query, filters) {
    const client = await pool.connect();

    let filterParams = [];
    let whereClauses = [];
    let joinFilter = '';
    let paramIndex = 3; // $1 = query, $2 = vector embedding

    try {
        await client.query("BEGIN");

        // Brand filter
        const brandObj = filters?.find(f => f.name === 'brand');
        if (brandObj?.value) {
            whereClauses.push(`p.brand = $${paramIndex}::text`);
            filterParams.push(brandObj.value);
            paramIndex++;
        }

        // Min price filter
        const minPriceObj = filters?.find(f => f.name === 'minPrice');
        if (minPriceObj?.value) {
            whereClauses.push(`p.min_price >= $${paramIndex}::numeric`);
            filterParams.push(Number(minPriceObj.value));
            paramIndex++;
        }

        // Max price filter
        const maxPriceObj = filters?.find(f => f.name === 'maxPrice');
        if (maxPriceObj?.value) {
            whereClauses.push(`p.max_price <= $${paramIndex}::numeric`);
            filterParams.push(Number(maxPriceObj.value));
            paramIndex++;
        }

        // Tags filter (text array overlap)
        const tagsObj = filters?.find(f => f.name === 'tags');
        if (tagsObj?.value) {
            const tagsArray = tagsObj.value
                .split('|')
                .map(tag => tag.trim())
                .filter(Boolean);
            if (tagsArray.length > 0) {
                whereClauses.push(`p.tags && $${paramIndex}::text[]`);
                filterParams.push(tagsArray);
                paramIndex++;
            }
        }

        // Facet filters (exclude the one being counted)
        const facetFilters = filters?.filter(f =>
            !['brand', 'minPrice', 'maxPrice', 'tags'].includes(f.name)
        );

        if (facetFilters?.length > 0) {
            let facetClauses = [];
            facetFilters.forEach(f => {
                if (!f.value) return;
                if (f.value.includes('|')) {
                    const values = f.value
                        .split('|')
                        .map(v => v.trim())
                        .filter(Boolean);
                    facetClauses.push(
                        `(attribute_name = $${paramIndex}::text 
                          AND value = ANY($${paramIndex + 1}::text[]))`
                    );
                    filterParams.push(f.name, values);
                    paramIndex += 2;
                } else {
                    facetClauses.push(
                        `(attribute_name = $${paramIndex}::text 
                          AND value = $${paramIndex + 1}::text)`
                    );
                    filterParams.push(f.name, f.value);
                    paramIndex += 2;
                }
            });
            if (facetClauses.length > 0) {
                joinFilter = `
                    JOIN (
                        SELECT product_id
                        FROM search_document_filters
                        WHERE ${facetClauses.join(' OR ')}
                        GROUP BY product_id
                        HAVING COUNT(*) = ${facetFilters.length}
                    ) AS f ON p.id = f.product_id
                `;
            }
        }

        // Embed Query Text
        const vectArr = await embedText(query);
        const vectEmb = Array.isArray(vectArr)
            ? `[${vectArr.join(',')}]`
            : vectArr;

        // Main Facet Query: count facets for products matching the current filters
        const sql = `
            WITH 
            ft AS (
                SELECT id::uuid, lexical_score 
                FROM search_lexical_fts($1, 1000)
            ),
            trgm AS (
                SELECT id::uuid, trigram_score 
                FROM search_lexical_trigram_similarity($1, 1000)
            ),
            semantic AS (
                SELECT id::uuid, semantic_score 
                FROM search_semantic_vector_similarity($2::vector, 1000)
            )
            SELECT
                f.attribute_name,
                f.value,
                COUNT(*) AS count
            FROM products p
            LEFT JOIN ft ON p.id = ft.id
            LEFT JOIN trgm ON p.id = trgm.id
            LEFT JOIN semantic ON p.id = semantic.id
            JOIN search_document_filters f ON f.product_id = p.id
            ${joinFilter}
            WHERE 
                (ft.id IS NOT NULL 
                OR trgm.id IS NOT NULL 
                OR semantic.id IS NOT NULL)
                ${whereClauses.length ? 'AND ' + whereClauses.join(' AND ') : ''}
            GROUP BY f.attribute_name, f.value
            ORDER BY f.attribute_name, count DESC
            LIMIT 100
        `;

        const finalParams = [query, vectEmb, ...filterParams];
        const { rows } = await client.query(sql, finalParams);
        await client.query("COMMIT");
        return rows;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}
