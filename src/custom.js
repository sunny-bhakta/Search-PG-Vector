require('dotenv').config();

const express = require('express');
const db = require('./data/db');
const app = express();

const embedText = require('./custom/embed');
const router = express.Router();

router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });

  console.log('Received search query:', q);
  const embedding = await embedText(q); // returns array length 768
  const embeddingVector = db.toVector(Array.isArray(embedding) ? embedding : Array.from(embedding));
    
  const query = `WITH lexical AS (
       SELECT * FROM search_lexical($1, 50)
     ), semantic AS (
       SELECT * FROM search_semantic($2::vector, 50)
     )
     SELECT results.id, results.title, results.blended_score
     FROM (
       SELECT p.id,
              p.title,
              0.3 * COALESCE(l.lexical_score, 0) +
              0.7 * COALESCE(s.semantic_score, 0) AS blended_score
       FROM cproducts p
       LEFT JOIN lexical  l ON p.id = l.id
       LEFT JOIN semantic s ON p.id = s.id
       WHERE l.id IS NOT NULL OR s.id IS NOT NULL
       ORDER BY blended_score DESC
       LIMIT 10
     ) AS results
     ORDER BY blended_score DESC;`;

//   console.log('Executing search with embedding vector:', embeddingVector, q);
  const res1 = await db.query(query, [q, embeddingVector]);
//   console.log('Search results:', res1);
  res.json(res1.rows);
});


app.use('/custom', router);
app.listen(4000, () => {
  console.log(`Server running on port 4000`);
});

// module.exports = router;