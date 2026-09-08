import request from 'supertest';
import { app } from '../index';
import { redisClient } from '../config/redis';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

jest.mock('../config/redis', () => ({
  redisClient: {
    exists: jest.fn(),
    hSet: jest.fn(),
    hGetAll: jest.fn()
  },
  connectRedis: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Authentication Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should successfully register a new user and return 201', async () => {
      (redisClient.exists as jest.Mock).mockResolvedValue(0);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_secret_password');
      (redisClient.hSet as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .post('/auth/register')
        .send({ username: 'newuser', password: 'password123', role: 'user' });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.username).toBe('newuser');
      expect(redisClient.hSet).toHaveBeenCalledWith('user:newuser', {
        username: 'newuser',
        password: 'hashed_secret_password',
        role: 'user'
      });
    });

    it('should return 400 when username or password is missing', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ username: 'incomplete' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Username and password are required');
    });

    it('should return 409 when the username already exists', async () => {
      (redisClient.exists as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .post('/auth/register')
        .send({ username: 'existinguser', password: 'password123' });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Username already exists');
    });
  });

  describe('POST /auth/login', () => {
    it('should successfully authenticate and return 200 with JWT token', async () => {
      (redisClient.hGetAll as jest.Mock).mockResolvedValue({
        username: 'validuser',
        password: 'hashed_secret_password',
        role: 'user'
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('valid-mocked-jwt-token');

      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'validuser', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBe('valid-mocked-jwt-token');
      expect(response.body.user).toEqual({ username: 'validuser', role: 'user' });
    });

    it('should return 400 when credentials are missing', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ username: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Username and password are required');
    });

    it('should return 401 when user is not found', async () => {
      (redisClient.hGetAll as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'nonexistent', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid username or password');
    });

    it('should return 401 when password does not match', async () => {
      (redisClient.hGetAll as jest.Mock).mockResolvedValue({
        username: 'validuser',
        password: 'hashed_secret_password',
        role: 'user'
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'validuser', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid username or password');
    });
  });
});
