
import { pool } from "./db.js";
import embedText from "./embedText.js";
import { expandQueryWithCategorySynonyms } from "./utils/category_synomys.js";

// * http://localhost:3000/api/search?q=jeans&filters=brand:puma,minPrice:50,maxPrice:150,tags:denim|slim
// Pagination: ?page=2&limit=10
// Sorting: ?sort=price:asc or ?sort=blended_score:desc
/**
 * Example URLs for category and category_path filters:
 * 
 * By category:
 *   /api/search?q=shoes&filters=category:sneakers
 * 
 * By category_path (for hierarchical categories):
 *   /api/search?q=shoes&filters=category_paths:clothing/footwear/sneakers
 * 
 * Multiple filters can be combined using commas:
 *   /api/search?q=shoes&filters=category:sneakers,brand:nike
 *   /api/search?q=shoes&filters=category_paths:clothing/footwear/sneakers,brand:nike
 * 
 * For multiple category_paths (OR logic):
 *   /api/search?q=shoes&filters=category_paths:clothing/footwear/sneakers|clothing/footwear/boots
 */
// Accepts: query, filters, options = { page, limit, sort }
export async function searchWithFilters(query, filters, options = {}) {
    // console.log('Executing search with query:', query, 'and filters:', filters);

    const client = await pool.connect();

    let filterParams = [];
    let whereClauses = [];
    let joinFilter = '';
    let paramIndex = 3; // $1 = tsQuery, $2 = vector embedding

    // Extract leaf category from filters (category_paths or category)
    let leafCategory = null;
    const categoryPathsObj = filters?.find(f => f.name === 'category_paths');
    if (categoryPathsObj?.value) {
        const catPath = Array.isArray(categoryPathsObj.value) ? categoryPathsObj.value[0] : categoryPathsObj.value;
        leafCategory = catPath.split('/').pop();
    } else {
        const categoryObj = filters?.find(f => f.name === 'category');
        if (categoryObj?.value) leafCategory = categoryObj.value;
    }

    // Expand query with category synonyms
    let expandedQueries = [query];
    if (leafCategory) {
        expandedQueries = await expandQueryWithCategorySynonyms(query, leafCategory);
    }
    const tsQuery = expandedQueries.join(' | ');

    // Pagination & Sorting defaults
    const page = Math.max(1, parseInt(options.page) || 1);
    const limit = Math.max(1, Math.min(parseInt(options.limit) || 20, 100)); // max 100
    const offset = (page - 1) * limit;
    // Whitelist allowed sort fields
    const allowedSort = {
        'blended_score': 'blended_score',
        'price': 'p.min_price',
        'name': 'p.name',
        'brand': 'p.brand',
    };
    let sortField = 'blended_score';
    let sortDir = 'DESC';
    if (options.sort) {
        const [field, dir] = options.sort.split(':');
        if (allowedSort[field]) sortField = allowedSort[field];
        if (dir && ['asc', 'desc'].includes(dir.toLowerCase())) sortDir = dir.toUpperCase();
    }

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
                p.id,
                p.name,
                p.brand,
                p.min_price,
                p.max_price,
                p.tags,
                p.in_stock,
                p.rating,
                p.is_sponsored,
                p.merch_priority,
                p.price_bucket,
                p.sale_price,
                p.sale_start,
                p.sale_end,
                p.is_pinned,
                p.pinned_rank,
                p.is_featured,
                CASE
                WHEN p.sale_price IS NOT NULL
                    AND NOW() >= p.sale_start
                    AND NOW() <= p.sale_end
                THEN p.sale_price
                ELSE p.min_price
                END AS display_price,
                COALESCE(ft.lexical_score, 0) * 0.4 +
                COALESCE(trgm.trigram_score, 0) * 0.2 +
                COALESCE(semantic.semantic_score, 0) * 0.4
                + (CASE WHEN p.in_stock THEN 0.1 ELSE 0 END)
                + (COALESCE(p.rating, 0) * 0.05)
                + (CASE WHEN p.is_sponsored THEN 0.2 ELSE 0 END)
                + (COALESCE(p.merch_priority, 0) * 0.1)
                + (CASE WHEN p.is_featured THEN 0.3 ELSE 0 END)
                + (CASE
                    WHEN p.price_bucket = 'low' THEN 0.02
                    WHEN p.price_bucket = 'mid' THEN 0.05
                    WHEN p.price_bucket = 'high' THEN 0.01
                    ELSE 0
                END)
                AS blended_score
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
            ORDER BY
                p.is_pinned DESC,
                p.pinned_rank ASC NULLS LAST,
                blended_score DESC,
                ${sortField} ${sortDir}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        filterParams.push(limit, offset);

        // -------------------------
        // Embed Query Text
        // -------------------------
        const vectArr = await embedText(query);
        const vectEmb = Array.isArray(vectArr)
            ? `[${vectArr.join(',')}]`
            : vectArr;

        // Use tsQuery as the first param
        const finalParams = [tsQuery, vectEmb, ...filterParams];

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

export async function getAutocompleteSuggestions(query, filters) {
    // Autocomplete with filters (brand, minPrice, maxPrice, tags, facets)
    const client = await pool.connect();
    let filterParams = [`%${query}%`];
    let whereClauses = ['name ILIKE $1'];
    let paramIndex = 2;

    // Brand filter
    const brandObj = filters?.find(f => f.name === 'brand');
    if (brandObj?.value) {
        whereClauses.push(`brand = $${paramIndex}::text`);
        filterParams.push(brandObj.value);
        paramIndex++;
    }

    // Min price filter
    const minPriceObj = filters?.find(f => f.name === 'minPrice');
    if (minPriceObj?.value) {
        whereClauses.push(`min_price >= $${paramIndex}::numeric`);
        filterParams.push(Number(minPriceObj.value));
        paramIndex++;
    }

    // Max price filter
    const maxPriceObj = filters?.find(f => f.name === 'maxPrice');
    if (maxPriceObj?.value) {
        whereClauses.push(`max_price <= $${paramIndex}::numeric`);
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
            whereClauses.push(`tags && $${paramIndex}::text[]`);
            filterParams.push(tagsArray);
            paramIndex++;
        }
    }

    // Facet filters (attribute_name/value pairs)
    const facetFilters = filters?.filter(f =>
        !['brand', 'minPrice', 'maxPrice', 'tags'].includes(f.name)
    );
    let joinFilter = '';
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
                    `(attribute_name = $${paramIndex}::text AND value = ANY($${paramIndex + 1}::text[]))`
                );
                filterParams.push(f.name, values);
                paramIndex += 2;
            } else {
                facetClauses.push(
                    `(attribute_name = $${paramIndex}::text AND value = $${paramIndex + 1}::text)`
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
                ) AS f ON products.id = f.product_id
            `;
        }
    }

    try {
        const sql = `
            SELECT id, name
            FROM products
            ${joinFilter}
            WHERE ${whereClauses.join(' AND ')}
            LIMIT 10
        `;
        const { rows } = await client.query(sql, filterParams);
        return rows;
    } catch (error) {
        throw error;
    } finally {
        client.release();
    }
}
