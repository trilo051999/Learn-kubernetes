# Service B - Worker

Service B is a background worker process that consumes job IDs from the Redis queue, executes CPU-bound workloads, and records processing statistics.

## Functionality
- Polls the Redis queue (`job_queue`) using `brPop` (blocking pop).
- Measures execution time in milliseconds using high-resolution timers (`process.hrtime`).
- Exposes an HTTP server on port 3001 to serve Prometheus metrics.

## CPU Workloads
1. **Primes Calculation**: Computes prime numbers up to 100,000.
2. **Bcrypt Hashing**: Hashes a password string using bcrypt with 10 salt rounds.
3. **Sorting**: Generates and sorts an array of 100,000 random integers.

## Metrics Exposed (`/metrics` on port 3001)
- `jobs_processed_total`: Labeled by status (success/error).
- `job_processing_time_seconds`: Histogram mapping execution duration.
- `job_errors_total`: Counter tracking total failures.

## Local Configuration
Requires a `.env` file containing:
```env
REDIS_URL=redis://localhost:6379
METRICS_PORT=3001
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
