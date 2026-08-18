import request = require('supertest');
import { app } from '../index';
import * as statsModel from '../models/statsModel';

// Mock the model layer to prevent querying a live Redis database
jest.mock('../models/statsModel');

describe('Service C API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /stats', () => {
    it('should aggregate stats successfully and return 200', async () => {
      const mockStats = {
        queueLength: 5,
        totalSubmitted: 20,
        totalCompleted: 14,
        totalFailed: 1,
        averageProcessingTimeMs: 420.5
      };

      const mockGetStats = jest.spyOn(statsModel, 'getStats').mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/stats');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStats);
      expect(mockGetStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /metrics', () => {
    it('should return Prometheus formatted metrics', async () => {
      const response = await request(app)
        .get('/metrics');

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toContain('text/plain');
      // Verify metrics output contains custom and default registered values
      expect(response.text).toContain('total_jobs_submitted');
      expect(response.text).toContain('total_jobs_completed');
      expect(response.text).toContain('queue_length');
    });
  });
});
