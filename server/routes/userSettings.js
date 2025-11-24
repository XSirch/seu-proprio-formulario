import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = express.Router();

// Middleware simples de autenticação local para estas rotas (reutiliza JWT)
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }

    const token = authHeader.substring(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

router.use(requireAuth);

// GET /api/user/settings/gemini - retorna apenas se há chave configurada
router.get('/settings/gemini', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT gemini_api_key_encrypted IS NOT NULL AS has_gemini_key FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ hasGeminiKey: result.rows[0].has_gemini_key });
  } catch (error) {
    console.error('Error loading Gemini settings:', error);
    res.status(500).json({ error: 'Failed to load Gemini settings' });
  }
});

// POST /api/user/settings/gemini - salva/atualiza chave criptografada
router.post('/settings/gemini', async (req, res) => {
  try {
    const { geminiApiKey } = req.body;

    if (!geminiApiKey || typeof geminiApiKey !== 'string') {
      return res.status(400).json({ error: 'Invalid Gemini API key' });
    }

    // Simples criptografia usando AES (chave derivada do JWT_SECRET)
    const crypto = await import('crypto');
    const algorithm = 'aes-256-gcm';
    const secret = process.env.JWT_SECRET || 'default-secret';
    const key = crypto.scryptSync(secret, 'gemini-salt', 32);
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(geminiApiKey, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    const payload = Buffer.concat([iv, authTag, encrypted]).toString('base64');

    await pool.query(
      'UPDATE users SET gemini_api_key_encrypted = $1 WHERE id = $2',
      [payload, req.userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving Gemini key:', error);
    res.status(500).json({ error: 'Failed to save Gemini key' });
  }
});

// GET /api/user/settings/gemini/key - (opcional) não será usado pelo frontend para exibir a chave,
// mas permite teste e poderia ser usado pelo backend para chamar o Gemini server-side.
router.get('/settings/gemini/key', async (req, res) => {
  try {
    const crypto = await import('crypto');
    const algorithm = 'aes-256-gcm';
    const secret = process.env.JWT_SECRET || 'default-secret';
    const key = crypto.scryptSync(secret, 'gemini-salt', 32);

    const result = await pool.query(
      'SELECT gemini_api_key_encrypted FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].gemini_api_key_encrypted) {
      return res.status(404).json({ error: 'No key stored' });
    }

    const buffer = Buffer.from(result.rows[0].gemini_api_key_encrypted, 'base64');
    const iv = buffer.subarray(0, 12);
    const authTag = buffer.subarray(12, 28);
    const encrypted = buffer.subarray(28);

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    res.json({ geminiApiKey: decrypted.toString('utf8') });
  } catch (error) {
    console.error('Error reading Gemini key:', error);
    res.status(500).json({ error: 'Failed to read Gemini key' });
  }
});

export default router;

