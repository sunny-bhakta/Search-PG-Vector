# Search PG Vector

Search PG Vector is a product discovery service that blends lexical search, semantic similarity (via pgvector), and Elasticsearch-style relevance boosts. The service exposes REST APIs for keyword search and autocomplete, plus a background pipeline for indexing and reindexing product data.

## Features

- **Hybrid relevance** – lexical, semantic, and custom boosters combined in one scoring pipeline.
- **Pgvector embeddings** – store and query product embeddings directly in Postgres.
- **Elasticsearch optionality** – use Elasticsearch as a secondary index for advanced ranking/analytics.
- **Event-driven pipeline** – workers respond to product update events and keep the search index in sync.
- **Operational tooling** – database seed and reindex scripts, metrics hooks, and logging utilities.

## Getting Started

### Prerequisites

- Node.js 18.18+ and npm 9+
- PostgreSQL 15+ with the `pgvector` extension installed
- (Optional) Elasticsearch 8+

### Installation

```bash
npm install
```

Create a `.env` file by copying `.env.example` and updating the values for your environment.

### Database

1. Enable `pgvector` inside your database:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
2. Run the initial migration:
   ```bash
   psql "$DATABASE_URL" -f migrations/20260209-init-search.sql
   ```
3. Seed with demo data:
   ```bash
   npm run seed
   ```

### Running the API

```bash
npm run dev
```

This will start the Express server with hot reloading via Nodemon. To run it in production mode, use `npm start`.

### Testing

```bash
npm test
```

The Jest test suite covers services, boosters, and API endpoints. Integration tests rely on the Express app but mock external systems (database, Elasticsearch) by default.

## Project Structure

```
search-pg-vector/
├── config/             # Environment-aware settings consumed via the `config` package
├── docs/               # Architecture notes and API contracts
├── scripts/            # Operational utilities (seed, reindex)
├── src/                # Application source grouped by domain
├── tests/              # Unit, integration, and e2e suites
├── migrations/         # SQL migrations for Postgres
└── Dockerfile          # Production build instructions
```

## Configuration

Key settings live in `config/default.json` and `config/production.json`. Override any value via environment variables; see `docs/architecture.md` for details.

## Deployment

A multi-stage Dockerfile is provided. Build it with:

```bash
docker build -t search-pg-vector .
```

Expose port `4000` (or whatever `PORT` you set) and supply environment variables at runtime.

## Next Steps

- Wire the pipeline to your message bus (Kafka, SNS/SQS, etc.).
- Swap out the mocked embedding generator with your model of choice.
- Integrate real monitoring/telemetry (Prometheus, OpenTelemetry, etc.).
