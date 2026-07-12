import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'assetflow-dev-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// ─── POST /api/auth/signup ──────────────────────────────────────────────────
// Creates a new user with role = 'employee' (never self-elevated)
export const signup = async (req: Request, res: Response) => {
  try {
    const { full_name, email, password } = req.body;

    // Validation
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'full_name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if email already exists
    const existing = await db.query('SELECT id FROM profiles WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert profile with role = 'employee' (DB default)
    const { rows } = await db.query(
      `INSERT INTO profiles (id, full_name, email, password_hash, role)
       VALUES (gen_random_uuid(), $1, $2, $3, 'employee')
       RETURNING id, full_name, email, role, created_at`,
      [full_name, email, password_hash]
    );

    const user = rows[0];

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
};

// ─── POST /api/auth/login ───────────────────────────────────────────────────
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Fetch user by email
    const { rows } = await db.query(
      `SELECT p.id, p.full_name, p.email, p.password_hash, p.role, p.status,
              p.department_id, d.name as department_name
       FROM profiles p
       LEFT JOIN departments d ON p.department_id = d.id
       WHERE p.email = $1`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];

    // Check if account is active
    if (user.status === 'inactive') {
      return res.status(403).json({ error: 'This account has been deactivated. Contact your admin.' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
        department_name: user.department_name,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

// ─── GET /api/auth/me ───────────────────────────────────────────────────────
// Returns the profile of the currently authenticated user
export const getMe = async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query(
      `SELECT p.id, p.full_name, p.email, p.role, p.status,
              p.department_id, d.name as department_name, p.created_at
       FROM profiles p
       LEFT JOIN departments d ON p.department_id = d.id
       WHERE p.id = $1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(rows[0]);
  } catch (error: any) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};
