import request from 'supertest';
import { app } from '../index';
import * as jobModel from '../models/jobModel';

// Mock the model layer to prevent querying a live Redis database
jest.mock('../models/jobModel');

describe('Service A API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /submit', () => {
    it('should submit a job successfully and return 202', async () => {
      const mockEnqueueJob = jest.spyOn(jobModel, 'enqueueJob').mockResolvedValue(undefined);

      const response = await request(app)
        .post('/submit')
        .send();

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('jobId');
      expect(response.body.status).toBe('submitted');
      expect(mockEnqueueJob).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /status/:id', () => {
    it('should return job metadata if the job exists', async () => {
      const mockJobData = {
        status: 'completed',
        submittedAt: '2026-08-18T10:00:00.000Z',
        result: 'Success'
      };

      const mockGetJobStatus = jest.spyOn(jobModel, 'getJobStatus').mockResolvedValue(mockJobData);

      const response = await request(app)
        .get('/status/some-job-id');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockJobData);
      expect(mockGetJobStatus).toHaveBeenCalledWith('some-job-id');
    });

    it('should return 404 if the job does not exist', async () => {
      jest.spyOn(jobModel, 'getJobStatus').mockResolvedValue(null);

      const response = await request(app)
        .get('/status/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Job not found');
    });
  });
});
