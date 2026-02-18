import express from 'express';
import { searchWithFilters, getFacetsWithFilters, getAutocompleteSuggestions } from './searchService.js';

const router = express.Router();

/**
 * Search endpoint
 * Query params:
 *   q=jeans
 *   filters=waist:32,color:blue,brand:levis,tags:sale|new|popular
 * 
 * To filter by brand or any other attribute, add it as a key:value pair in the filters query param.
 * For multiple values (e.g., tags), separate them with a pipe (|): filters=tags:sale|new|popular
 * Example: filters=brand:nike,color:red,size:medium,tags:sale|clearance
 * 
blue
 * http://localhost:3000/api/search?q=jeans&filters=brand:puma,minPrice:50,maxPrice:150,tags:denim|slim,color:blue
 * 
 * In your code, you can split the value by '|' for multi-value filters.
 */
router.get('/search', async (req, res) => {
  const q = req.query.q || '';
  const filtersStr = req.query.filters || '';

  const sort = req.query.sort || '';
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.pageSize, 10) || 20; // pageSize maps to limit

  const filters = filtersStr.split(',').filter(Boolean).map(pair => {
    const [name, value] = pair.split(':');
    return { name, value };
  });

  const pagination = { sort, page, limit };

  const results = await searchWithFilters(q, filters, pagination);
  res.json(results);
});

// getFacetsWithFilters
router.get('/facets', async (req, res) => {
  const q = req.query.q || '';
  const filtersStr = req.query.filters || '';

  const filters = filtersStr.split(',').filter(Boolean).map(pair => {
    const [name, value] = pair.split(':');
    return { name, value };
  });

  const results = await getFacetsWithFilters(q, filters);
  res.json(results);
});

router.get('/autocomplete', async (req, res) => {
  const q = req.query.q || '';
  const filtersStr = req.query.filters || '';

  const filters = filtersStr.split(',').filter(Boolean).map(pair => {
    const [name, value] = pair.split(':');
    return { name, value };
  });

  const results = await getAutocompleteSuggestions(q, filters);
  res.json(results);
});

export default router;
