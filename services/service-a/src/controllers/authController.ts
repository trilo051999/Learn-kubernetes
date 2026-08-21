import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { redisClient } from '../config/redis';

const JWT_SECRET = process.env.JWT_SECRET || 'my-super-secret-key-12345';

export async function register(req: Request, res: Response): Promise<void> {
  const { username, password, role } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const userKey = `user:${username}`;

  try {
    const exists = await redisClient.exists(userKey);
    if (exists === 1) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'admin' ? 'admin' : 'user';

    await redisClient.hSet(userKey, {
      username,
      password: hashedPassword,
      role: userRole
    });

    res.status(201).json({ message: 'User registered successfully', username, role: userRole });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const userKey = `user:${username}`;

  try {
    const userData = await redisClient.hGetAll(userKey);

    if (!userData || !userData.username) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, userData.password);

    if (!isMatch) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const token = jwt.sign(
      { username: userData.username, role: userData.role },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        username: userData.username,
        role: userData.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
