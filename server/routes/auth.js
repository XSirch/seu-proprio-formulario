import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = express.Router();

// Helper to calculate level from XP
function calculateLevel(xp) {
  return Math.floor(xp / 1000) + 1;
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, pendingXp } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Calculate initial XP (bonus for signup or pending XP)
    const initialXp = pendingXp > 0 ? pendingXp : 500;
    const level = calculateLevel(initialXp);

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, xp, level) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, avatar, xp, level',
      [name, email, passwordHash, initialXp, level]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        xp: user.xp,
        level: user.level
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, name, email, password_hash, avatar, xp, level FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        xp: user.xp,
        level: user.level
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// GET /api/auth/me - retorna dados do usuário autenticado incluindo status da chave Gemini (sem a chave em si)
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }

    const token = authHeader.substring(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      'SELECT id, name, email, avatar, xp, level, gemini_api_key_encrypted IS NOT NULL AS has_gemini_key FROM users WHERE id = $1',
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      xp: user.xp,
      level: user.level,
      hasGeminiKey: user.has_gemini_key,
    });
  } catch (error) {
    console.error('Error in /me:', error);
    res.status(500).json({ error: 'Failed to load user profile' });
  }
});


export default router;

