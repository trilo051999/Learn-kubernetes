# Service A - Job Submitter (API Gateway)

Service A acts as the entrypoint API Gateway. It exposes endpoints to receive job payloads, registers them in Redis, queues them, and allows users to query their processing state.

## Functionality
- Receives HTTP requests.
- Generates a unique UUID `jobId` for each job.
- Saves the initial metadata state (`status: "pending"`, `submittedAt`) in a Redis Hash.
- Pushes the `jobId` onto a Redis List (`job_queue`) acting as the system's FIFO queue.

## API Endpoints
- `POST /submit`: Enqueues a new job.
- `GET /status/:id`: Returns the job metadata for the matching ID.

## Local Configuration
Requires a `.env` file containing:
```env
PORT=3000
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
