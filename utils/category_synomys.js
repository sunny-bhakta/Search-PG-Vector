import "../env.js"
import {pool} from '../db.js';

// Insert category-based synonyms (about 40 records)
export async function seedCategorySynonyms() {
  const synonyms = [
    { category: 'jeans', term: 'denim', synonym: 'jeans' },
    { category: 'jeans', term: 'pants', synonym: 'jeans' },
    { category: 'jeans', term: 'trousers', synonym: 'jeans' },
    { category: 'jeans', term: 'blue jeans', synonym: 'jeans' },
    { category: 'jeans', term: 'skinny', synonym: 'jeans' },
    { category: 'jeans', term: 'slim', synonym: 'jeans' },
    { category: 'jeans', term: 'straight', synonym: 'jeans' },
    { category: 'jeans', term: 'bootcut', synonym: 'jeans' },
    { category: 'jeans', term: 'stretch', synonym: 'jeans' },
    { category: 'jeans', term: 'levis', synonym: 'jeans' },
    { category: 'shoes', term: 'sneakers', synonym: 'shoes' },
    { category: 'shoes', term: 'trainers', synonym: 'shoes' },
    { category: 'shoes', term: 'footwear', synonym: 'shoes' },
    { category: 'shoes', term: 'boots', synonym: 'shoes' },
    { category: 'shoes', term: 'loafers', synonym: 'shoes' },
    { category: 'shoes', term: 'slip-ons', synonym: 'shoes' },
    { category: 'shoes', term: 'running', synonym: 'shoes' },
    { category: 'shoes', term: 'athletic', synonym: 'shoes' },
    { category: 'shoes', term: 'nike', synonym: 'shoes' },
    { category: 'jackets', term: 'parka', synonym: 'jackets' },
    { category: 'jackets', term: 'coat', synonym: 'jackets' },
    { category: 'jackets', term: 'outerwear', synonym: 'jackets' },
    { category: 'jackets', term: 'blazer', synonym: 'jackets' },
    { category: 'jackets', term: 'windbreaker', synonym: 'jackets' },
    { category: 'jackets', term: 'leather', synonym: 'jackets' },
    { category: 'jackets', term: 'denim', synonym: 'jackets' },
    { category: 'jackets', term: 'puffer', synonym: 'jackets' },
    { category: 'jackets', term: 'anorak', synonym: 'jackets' },
    { category: 'jackets', term: 'northface', synonym: 'jackets' },
    { category: 'tshirts', term: 'tee', synonym: 'tshirts' },
    { category: 'tshirts', term: 'top', synonym: 'tshirts' },
    { category: 'tshirts', term: 'shirt', synonym: 'tshirts' },
    { category: 'tshirts', term: 'crewneck', synonym: 'tshirts' },
    { category: 'tshirts', term: 'v-neck', synonym: 'tshirts' },
    { category: 'tshirts', term: 'graphic', synonym: 'tshirts' },
    { category: 'tshirts', term: 'cotton', synonym: 'tshirts' },
    { category: 'tshirts', term: 'performance', synonym: 'tshirts' },
    { category: 'tshirts', term: 'adidas', synonym: 'tshirts' },
    { category: 'pants', term: 'chinos', synonym: 'pants' },
    { category: 'pants', term: 'trousers', synonym: 'pants' },
    { category: 'pants', term: 'slacks', synonym: 'pants' },
    { category: 'pants', term: 'bottoms', synonym: 'pants' }
  ];

try {
    // Check if table exists, create if not
    await pool.query(`
        CREATE TABLE IF NOT EXISTS category_synonyms (
            id SERIAL PRIMARY KEY,
            category VARCHAR(50),
            term VARCHAR(50),
            synonym VARCHAR(50)
        );
    `);

    for (const syn of synonyms) {
        await pool.query(
            `INSERT INTO category_synonyms (category, term, synonym)
             VALUES ($1, $2, $3)
             ON CONFLICT DO NOTHING`,
            [syn.category, syn.term, syn.synonym]
        );
    }
    console.log('Seeded category-based synonyms.');
} catch (err) {
    console.error('Error seeding category synonyms:', err);
}
}
// seedCategorySynonyms();

// Expand query with category synonyms
export async function expandQueryWithCategorySynonyms(query, category) {
  const { rows } = await pool.query(
    `SELECT synonym FROM category_synonyms WHERE category = $1 AND term = $2`,
    [category, query]
  );
  if (rows.length > 0) {
    return [query, ...rows.map(r => r.synonym)];
  }
  return [query];
}