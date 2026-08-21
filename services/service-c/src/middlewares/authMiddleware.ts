import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'my-super-secret-key-12345';

export interface AuthenticatedRequest extends Request {
  user?: {
    username: string;
    role: string;
  };
}

export function verifyAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Admin access token missing' });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Access token missing' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string; role: string };

    if (decoded.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired admin token' });
  }
}
