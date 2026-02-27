import { pool } from '../db.js';
import { readFile } from 'fs/promises';
import path from 'path';
import products from './seed_products.js';
import embedText from '../embedText.js';

async function runSqlFile(filePath) {
    const sql = await readFile(filePath, 'utf8');
    await pool.query(sql);
    console.log(`Executed SQL file: ${filePath}`);
}

async function seedProducts() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        brand TEXT,
        category_paths TEXT[],
        tags TEXT[],
        min_price NUMERIC,
        max_price NUMERIC,
        embedding VECTOR(768),
        search_vector TSVECTOR,
        in_stock BOOLEAN,
        updated_at TIMESTAMP,
        rating NUMERIC,
        is_sponsored BOOLEAN DEFAULT FALSE,
        merch_priority INTEGER DEFAULT 0,
        price_bucket TEXT,
        sale_price NUMERIC,
        sale_start TIMESTAMP,
        sale_end TIMESTAMP,
        is_pinned BOOLEAN DEFAULT FALSE,
        pinned_rank INTEGER,
        is_featured BOOLEAN DEFAULT FALSE
      )
    `);
    for (const product of products) {
        const embeddingArr = await embedText(`${product.name} ${product.description}`);
        const embedding = Array.isArray(embeddingArr)
            ? `[${embeddingArr.join(',')}]`
            : embeddingArr;
        await pool.query(
            `INSERT INTO products 
        (id, name, description, brand, category_paths, tags, min_price, max_price, embedding, in_stock, updated_at, search_vector,
         rating, is_sponsored, merch_priority, price_bucket, sale_price, sale_start, sale_end, is_pinned, pinned_rank, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
         setweight(to_tsvector('english', coalesce($2, '')), 'A') ||
         setweight(to_tsvector('english', coalesce($3, '')), 'B'),
         $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
       )
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         brand = EXCLUDED.brand,
         category_paths = EXCLUDED.category_paths,
         tags = EXCLUDED.tags,
         min_price = EXCLUDED.min_price,
         max_price = EXCLUDED.max_price,
         embedding = EXCLUDED.embedding,
         in_stock = EXCLUDED.in_stock,
         updated_at = EXCLUDED.updated_at,
         search_vector = setweight(to_tsvector('english', coalesce(EXCLUDED.name, '')), 'A') ||
                         setweight(to_tsvector('english', coalesce(EXCLUDED.description, '')), 'B'),
         rating = EXCLUDED.rating,
         is_sponsored = EXCLUDED.is_sponsored,
         merch_priority = EXCLUDED.merch_priority,
         price_bucket = EXCLUDED.price_bucket,
         sale_price = EXCLUDED.sale_price,
         sale_start = EXCLUDED.sale_start,
         sale_end = EXCLUDED.sale_end,
         is_pinned = EXCLUDED.is_pinned,
         pinned_rank = EXCLUDED.pinned_rank,
         is_featured = EXCLUDED.is_featured
      `,
            [
                product.product_id,
                product.name,
                product.description,
                product.brand,
                product.category_paths,
                product.tags,
                product.min_price,
                product.max_price,
                embedding,
                product.in_stock,
                product.updated_at,
                // search_vector is generated in SQL
                product.rating,
                product.is_sponsored,
                product.merch_priority,
                product.price_bucket,
                product.sale_price,
                product.sale_start,
                product.sale_end,
                product.is_pinned,
                product.pinned_rank,
                product.is_featured
            ]
        );
    }
    console.log('Seeded products and updated search_vector successfully.');
}


async function seedFilters() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS filters (
        id SERIAL PRIMARY KEY,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        attribute_name TEXT NOT NULL,
        value TEXT NOT NULL
      )
    `);
    console.log('Created filters table successfully.');
}

async function main() {
    try {
        // Then seed products via JS
        await seedProducts();
        // await seedFilters();
        // Run SQL helpers first
        await runSqlFile(path.resolve('migrations/function-helpers.sql'));
        await runSqlFile(path.resolve('migrations/index.sql'));
        // Optionally run other .sql files here
        // await runSqlFile(path.resolve('migrations/seed-products.sql'));

        
        console.log('Seeding completed successfully.');
    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        await pool.end();
    }
}

// if (process.env.NODE_ENV !== 'test') {
main();
// }

