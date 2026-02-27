// utils/seedDictionary.js
// Script to seed the dictionary table with common words or product names
import { pool } from '../db.js';

const words = [
  'jeans', 'denim', 'shirt', 'tshirt', 'shoes', 'sneakers', 'jacket', 'coat',
  'pants', 'trousers', 'slacks', 'boots', 'loafers', 'parka', 'blazer',
  'windbreaker', 'leather', 'puffer', 'anorak', 'northface', 'tee', 'top',
  'crewneck', 'v-neck', 'graphic', 'cotton', 'performance', 'adidas', 'nike',
  'chinos', 'bottoms', 'outerwear', 'footwear', 'slip-ons', 'running', 'athletic',
  'blue jeans', 'skinny', 'slim', 'straight', 'bootcut', 'stretch', 'levis',
  // Add more as needed
];

async function seedDictionary() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dictionary (
        word TEXT PRIMARY KEY
      );
    `);
    for (const word of words) {
      await pool.query(
        `INSERT INTO dictionary (word) VALUES ($1) ON CONFLICT DO NOTHING`,
        [word]
      );
    }
    console.log('Dictionary seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding dictionary:', err);
    process.exit(1);
  }
}

seedDictionary();
