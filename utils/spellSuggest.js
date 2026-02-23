// Simple spell suggestion using pg_trgm and a dictionary table
import { pool } from '../db.js';

/**
 * Suggest the closest word from the dictionary using trigram similarity
 * @param {string} term - The possibly misspelled word
 * @returns {Promise<string|null>} - The best suggestion or null if none found
 */
export async function correctSpelling(term) {
  const { rows } = await pool.query(
    `SELECT word FROM dictionary
     WHERE word % $1
     ORDER BY similarity(word, $1) DESC
     LIMIT 1`,
    [term]
  );
  return rows[0]?.word || null;
}
