# API Contracts

## GET `/api/health`

Simple readiness probe.

**Response**
```json
{
  "status": "ok",
  "timestamp": "2026-02-09T12:00:00.000Z"
}
```

---

## GET `/api/search`

Hybrid lexical/semantic search.

### Query Parameters
- `q` *(string)* – search phrase (optional, but at least `q` or filters should exist).
- `brand`, `category` *(string)* – filter by product attributes.
- `tags` *(comma-separated list)* – requires all provided tags.
- `minPrice`, `maxPrice` *(number)* – price range (in cents) evaluated against any variant.
- `inStock` *(boolean)* – `true` to require any variant with inventory > 0.
- `page`, `limit` *(number)* – pagination controls.
- `sort` *(string)* – comma-separated instructions, e.g. `lexical:desc,recency:desc`.

**Example**
```
/api/search?q=jogger&brand=Northwind&category=apparel&tags=joggers,pants&minPrice=5000&maxPrice=10000&inStock=true&page=1&limit=20&sort=lexical:desc,recency:desc
```


### Body (optional)
```json
{
  "vector": [0.12, 0.03, ...]
}
```
An embedding supplied by the caller for semantic search. If omitted, only lexical + boosters run.

### Response
```json
{
  "items": [
    {
      "product": { "id": "...", "title": "..." },
      "variants": [{ "sku": "..." }],
      "score": 1.234,
      "breakdown": {
        "lexical": 0.8,
        "semantic": 0.3,
        "booster": 0.134
      }
    }
  ],
  "page": 1,
  "limit": 20,
  "count": 2
}
```

---

## GET `/api/search/autocomplete`

Returns top product title suggestions.

### Query Parameters
- `q` *(string, required)* – prefix string.
- `limit` *(number, optional)* – max suggestions (default 10).

### Response
```json
{
  "suggestions": ["trail shoe", "trail sneaker"]
}
```
