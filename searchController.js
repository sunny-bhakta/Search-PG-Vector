import express from 'express';
import { searchWithFilters } from './searchService.js';

const router = express.Router();

// /**
//  * Create or update a search document
//  */
// router.post('/document', async (req, res) => {
//   const { doc, filters } = req.body;

//   await upsertSearchDocument(doc);
//   await upsertSearchDocumentFilters(doc.product_id, filters);

//   res.json({ ok: true });
// });

/**
 * Search endpoint
 * Query params:
 *   q=jeans
 *   filters=waist:32,color:blue
 */
// router.get('/search', async (req, res) => {
//   const q = req.query.q || '';
//   const filtersStr = req.query.filters || '';

//   const filters = filtersStr.split(',').filter(Boolean).map(pair => {
//     const [name, value] = pair.split(':');
//     return { name, value };
//   });

//   const results = await searchWithFilters2(q, filters);
//   res.json(results);
// });


/**
 * Search endpoint
 * Query params:
 *   q=jeans
 *   filters=waist:32,color:blue
 */
router.get('/search', async (req, res) => {
  const q = req.query.q || '';
  const filtersStr = req.query.filters || '';

  const filters = filtersStr.split(',').filter(Boolean).map(pair => {
    const [name, value] = pair.split(':');
    return { name, value };
  });

  const results = await searchWithFilters(q, filters);
  res.json(results);
});

export default router;
