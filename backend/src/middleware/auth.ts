import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'assetflow-dev-secret-key-change-in-production';

// Extend Express Request to include a user object
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        department_id: string | null;
      };
    }
  }
}

// ─── Real Auth Middleware ────────────────────────────────────────────────────
// Validates JWT token from Authorization header and attaches user to request
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please provide a valid token.' });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };

    // Fetch the user's current profile from DB to get fresh role/status
    const { rows } = await db.query(
      'SELECT id, role, department_id, status FROM profiles WHERE id = $1',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found. Token may be invalid.' });
    }

    const user = rows[0];

    if (user.status === 'inactive') {
      return res.status(403).json({ error: 'Account deactivated. Contact your admin.' });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      role: user.role,
      department_id: user.department_id,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};
