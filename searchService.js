import { pool } from "./db.js";
import embedText from "./embedText.js";


// /**
//  * Search with filters
//  */
// export async function searchWithFilters2(query, filters) {
//     // console.log('Executing search with query:', query, 'and filters:', filters);
//     const client = await pool.connect();
//     try {
//         await client.query("BEGIN");


//         // Build parameterized filter conditions
//         let filterClause = '';
//         let filterParams = [query, filters.length];
//         if (filters.length > 0) {
//             const filterTuples = filters.map((f, i) => `($${i * 2 + 3}, $${i * 2 + 4})`).join(', ');
//             filterClause = `WHERE (attribute_name, value) IN (${filterTuples})`;
//             filters.forEach(f => {
//                 filterParams.push(f.name, f.value);
//             });
//         }

//         const sql = `
//             WITH text_results AS (
//                 SELECT product_id, similarity(name, $1) AS score
//                 FROM search_documents
//                 WHERE name % $1
//                 ORDER BY score DESC
//                 LIMIT 50
//             ),
//             filter_results AS (
//                 SELECT product_id
//                 FROM search_document_filters
//                 ${filterClause}
//                 GROUP BY product_id
//                 HAVING COUNT(*) = $2
//             )
//             SELECT sd.*
//             FROM text_results t
//             JOIN search_documents sd ON t.product_id = sd.product_id
//             JOIN filter_results f ON sd.product_id = f.product_id
//             WHERE sd.in_stock = true
//             ORDER BY t.score DESC
//             LIMIT 50
//         `;

//         const { rows } = await client.query(sql, filterParams);

//         await client.query("COMMIT");
//         return rows;
//     } catch (error) {
//         await client.query("ROLLBACK");
//         throw error;
//     } finally {
//         client.release();
//     }
// }

export async function searchWithFilters(query, filters) {
    console.log('Executing search with query:', query, 'and filters:', filters);
    const client = await pool.connect();
    let filterClause = '';
    let filterParams = [];
    let havingClause = '';
    let joinFilter = '';
    if (filters && filters.length > 0) {
        const filterTuples = filters.map((f, i) => `($${i * 2 + 3}, $${i * 2 + 4})`).join(', ');
        filterClause = `WHERE (attribute_name, value) IN (${filterTuples})`;
        havingClause = `HAVING COUNT(*) = ${filters.length}`;
        joinFilter = `
             JOIN (
                SELECT product_id
                FROM search_document_filters
                ${filterClause}
                GROUP BY product_id
                ${havingClause}
            )
                AS f ON p.id = f.product_id
            `;
        filters.forEach(f => {
            filterParams.push(f.name, f.value);
        });
    }
    try {
        await client.query("BEGIN");
        const sql = `
            WITH 
                ft AS (
                    SELECT id::uuid, lexical_score FROM search_lexical_fts($1, 50)
                ),
                trgm AS (
                    SELECT id::uuid, trigram_score FROM search_lexical_trigram_similarity($1, 50)
                ),
                semantic AS (
                    SELECT id::uuid, semantic_score FROM search_semantic_vector_similarity($2::vector, 50)
                )
            SELECT
                p.id,
                p.name,
                COALESCE(ft.lexical_score, 0) * 0.4 +
                COALESCE(trgm.trigram_score, 0) * 0.2 +
                COALESCE(semantic.semantic_score, 0) * 0.4 AS blended_score
            FROM products p
            LEFT JOIN ft ON p.id = ft.id
            LEFT JOIN trgm ON p.id = trgm.id
            LEFT JOIN semantic ON p.id = semantic.id
            ${joinFilter}
            WHERE ft.id IS NOT NULL OR trgm.id IS NOT NULL OR semantic.id IS NOT NULL
            ORDER BY blended_score DESC
            LIMIT 20
        `;


        const vectArr = await embedText(query);
        // Convert array to Postgres vector string: "[0.1,0.2,0.3]"
        const vectEmb = Array.isArray(vectArr) ? `[${vectArr.join(',')}]` : vectArr;
        const { rows } = await client.query(sql, [query, vectEmb, ...filterParams]);

        await client.query("COMMIT");
        return rows;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}
