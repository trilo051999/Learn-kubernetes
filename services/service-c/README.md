# Service C - Stats Aggregator

Service C acts as the stats aggregator. It queries Redis, computes system-wide stats and averages, and exposes Prometheus-formatted metrics.

## Functionality
- Polls Redis to determine queue backlog size.
- Aggregates total submitted, completed, and failed job counts.
- Computes the average processing time of all successfully processed jobs.
- Uses `prom-client` to run a background polling scheduler and expose metrics.

## API Endpoints
- `GET /stats`: Returns JSON summary containing queue length, total job counts, and average duration.
- `GET /metrics`: Serves Prometheus metrics (`queue_length`, `total_jobs_submitted`, `total_jobs_completed`).

## Local Configuration
Requires a `.env` file containing:
```env
PORT=3002
REDIS_URL=redis://localhost:6379
```

## Running Locally

### Install dependencies
```bash
npm install
```

### Build (Compile TS to JS)
```bash
npm run build
```

### Run in Development
```bash
npm run dev
```

### Run Tests
```bash
npm run test
```
