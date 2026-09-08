# Kubernetes Microservices Monitoring Assignment

This project implements a modular microservices architecture designed to demonstrate queue-based processing, metrics collection, and horizontal autoscaling. It consists of three Node.js TypeScript services coordinated with a Redis queue.

## System Architecture

The workflow of the system is structured as follows:

```
                            [ Web Client / ab ]
                                     |
                       HTTP POST     |    HTTP GET
                       /submit       |    /status/:id
                                     v
                       +---------------------------+
                       | Service A (API Gateway)   |
                       +-------------+-------------+
                                     |
                Push jobId (LPUSH)   |    Read job status (HGETALL)
                                     v
                       +---------------------------+
                       |       Redis Queue         |
                       +-------------+-------------+
                                     |
                Block & Pop (BRPOP)  |    Update status & results (HSET)
                                     v
  +----------------------------------+----------------------------------+
  |                                  |                                  |
  v                                  v                                  v
+-------------------+      +-------------------+      +-------------------+
|     Worker B1     |      |     Worker B2     |      |     Worker Bn     |
| (Exposes port     |      | (Exposes port     |      | (Exposes port     |
|  3001/metrics)    |      |  3001/metrics)    |      |  3001/metrics)    |
+-------------------+      +-------------------+      +-------------------+
  (Worker replicas scale horizontally based on CPU usage under Kubernetes HPA)

                                     ^
                                     | Scrapes /metrics on ports 3001/3002
                                     |
                       +-------------+-------------+
                       |   Prometheus Monitoring   |
                       +-------------+-------------+
                                     ^
                                     | Reads metrics data
                                     |
                       +-------------+-------------+
                       |    Grafana Dashboards     |
                       +---------------------------+
                                     ^
                                     | Queries stats
                                     |
                       +-------------+-------------+
                       | Service C (Stats Agg)     | (Exposes /stats and
                       | (Exposes port 3002)       |  /metrics endpoints)
                       +---------------------------+
```

---

## Services Overview

### 1. Service A (API Gateway)
* **Functionality**: Serves as the public ingress interface.
* **Port**: 3000
* **API Endpoints**:
  * `POST /submit`: Generates a unique UUID job ID, writes status `pending` to a Redis hash, and pushes the job ID onto the Redis list queue.
  * `GET /status/:id`: Queries the Redis hash metadata to return the current status, timestamps, and results of the job.

### 2. Service B (Worker)
* **Functionality**: Consumes jobs from the Redis queue and executes CPU-intensive workloads.
* **Metrics Port**: 3001
* **Execution workloads**:
  * Primes calculation up to 100,000.
  * Cryptographic bcrypt password hashing (10 rounds).
  * Generation and sorting of an array of 100,000 integers.
* **Metrics Exposed (`/metrics`)**:
  * `jobs_processed_total`: Count of processed jobs labeled by status (success/error).
  * `job_processing_time_seconds`: Histogram bucket tracking processing durations.
  * `job_errors_total`: Count of processing failures.

### 3. Service C (Stats Aggregator)
* **Functionality**: Aggregates raw state values from Redis to compute metrics and provide summaries.
* **Port**: 3002
* **API Endpoints**:
  * `GET /stats`: Returns JSON summary containing:
    * `queueLength`: Current backlog of jobs waiting in the queue.
    * `totalSubmitted`: Total submitted jobs.
    * `totalCompleted`: Total successfully completed jobs.
    * `totalFailed`: Total errored jobs.
    * `averageProcessingTimeMs`: Calculated average processing time of all completed jobs.
  * `GET /metrics`: Exposes Prometheus-formatted system metrics (`queue_length`, `total_jobs_submitted`, `total_jobs_completed`).

---

## Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
* Docker and Docker Compose
* Node.js (version 24 or 25)
* curl (for API testing)

### Run Locally (Docker Compose)
To compile and spin up the complete local environment, run the following command from the root directory:
```bash
docker compose up --build
```
This starts four containers: `redis`, `service-a`, `service-b`, and `service-c`.

---

## Testing the APIs

1. **Submit a Job**:
   ```bash
   curl -X POST http://localhost:3000/submit
   ```
   *Response*: `{"jobId":"<uuid>","status":"submitted"}`

2. **Check Job Status** (Replace `<jobId>` with the UUID returned from the previous step):
   ```bash
   curl http://localhost:3000/status/<jobId>
   ```

3. **Check Aggregated Statistics**:
   ```bash
   curl http://localhost:3002/stats
   ```

4. **Verify Service C Prometheus Metrics**:
   ```bash
   curl http://localhost:3002/metrics
   ```

5. **Verify Service B Prometheus Metrics**:
   ```bash
   curl http://localhost:3001/metrics
   ```

---

## Running Unit Tests

Each service has a fully configured Jest test suite. To run the tests for a specific service:

### Service A
```bash
cd services/service-a
npm run test
```

### Service B
```bash
cd services/service-b
npm run test
```

### Service C
```bash
cd services/service-c
npm run test
```

---

## Kubernetes Deployment & Observability

All Kubernetes manifests are organized under the `k8s/` directory:

| Manifest | Purpose |
| --- | --- |
| `k8s/configmap.yaml` | Application configuration (Redis URL, Ports, JWT Secret, Rate Limits) |
| `k8s/redis.yaml` | Redis queue deployment and service |
| `k8s/service-a.yaml` | API Gateway deployment and service |
| `k8s/service-b.yaml` | Worker deployment with CPU constraints and metrics port 3001 |
| `k8s/service-c.yaml` | Stats Aggregator deployment and service on port 3002 |
| `k8s/ingress.yaml` | NGINX Ingress rules with connection and request rate limits |
| `k8s/hpa.yaml` | Horizontal Pod Autoscaler scaling Service B from 2 to 10 pods (70% CPU target) |
| `k8s/prometheus-servicemonitor.yaml` | ServiceMonitors for automated Prometheus scraping of Service B and C |
| `k8s/grafana-dashboard.yaml` | Declarative ConfigMap containing pre-built "Kubernetes Microservices Monitoring" dashboard |
| `k8s/grafana.yaml` | Standalone Grafana deployment, service, and datasource provisioning |

### Accessing Grafana Dashboards

1. Forward Grafana to localhost:
```bash
kubectl port-forward svc/prometheus-grafana 3003:80
```
*(Or if using standalone Grafana: `kubectl port-forward svc/grafana-service 3003:3003`)*

2. Open `http://localhost:3003` in your browser.
3. Login Credentials:
   * **Username**: `admin`
   * **Password**: `KXiWlwLRT04JSsbldx8PpfEqtPSK13QsTBsr1eeO` *(or `admin123` on standalone)*
4. Navigate to **Dashboards** > **Kubernetes Microservices Monitoring** to view:
   * Queue Backlog (gauge and real-time timeline)
   * Total Jobs Submitted and Completed
   * Worker Pods CPU Usage
   * Service B Active Pods and Autoscaling Scaling History
   * Average Job Processing Duration

