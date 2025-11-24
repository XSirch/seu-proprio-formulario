import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/forms - Get all forms for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, fields, theme, logo_url, response_count, created_at FROM forms WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );

    const forms = result.rows.map(row => ({
      id: row.id.toString(),
      title: row.title,
      fields: row.fields,
      theme: row.theme,
      logoUrl: row.logo_url,
      responseCount: row.response_count,
      createdAt: row.created_at.toISOString()
    }));

    res.json(forms);
  } catch (error) {
    console.error('Get forms error:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

// POST /api/forms - Create new form
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, fields, theme, logoUrl } = req.body;

    if (!title || !fields) {
      return res.status(400).json({ error: 'Title and fields are required' });
    }

    const result = await pool.query(
      'INSERT INTO forms (user_id, title, fields, theme, logo_url) VALUES ($1, $2, $3, $4, $5) RETURNING id, title, fields, theme, logo_url, response_count, created_at',
      [req.user.userId, title, JSON.stringify(fields), theme ? JSON.stringify(theme) : null, logoUrl || null]
    );

    const form = result.rows[0];

    res.status(201).json({
      id: form.id.toString(),
      title: form.title,
      fields: form.fields,
      theme: form.theme,
      logoUrl: form.logo_url,
      responseCount: form.response_count,
      createdAt: form.created_at.toISOString()
    });
  } catch (error) {
    console.error('Create form error:', error);
    res.status(500).json({ error: 'Failed to create form' });
  }
});

// PUT /api/forms/:id - Update form
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, fields, theme, logoUrl } = req.body;

    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT id FROM forms WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found or access denied' });
    }

    const result = await pool.query(
      'UPDATE forms SET title = $1, fields = $2, theme = $3, logo_url = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, title, fields, theme, logo_url, response_count, created_at',
      [title, JSON.stringify(fields), theme ? JSON.stringify(theme) : null, logoUrl || null, id]
    );

    const form = result.rows[0];

    res.json({
      id: form.id.toString(),
      title: form.title,
      fields: form.fields,
      theme: form.theme,
      logoUrl: form.logo_url,
      responseCount: form.response_count,
      createdAt: form.created_at.toISOString()
    });
  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({ error: 'Failed to update form' });
  }
});

// DELETE /api/forms/:id - Delete form
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT id FROM forms WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found or access denied' });
    }

    await pool.query('DELETE FROM forms WHERE id = $1', [id]);

    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

// GET /api/forms/:id/public - Get form for public access (no authentication required)
router.get('/:id/public', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, title, fields, theme, logo_url FROM forms WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const form = result.rows[0];

    res.json({
      id: form.id.toString(),
      title: form.title,
      fields: form.fields,
      theme: form.theme,
      logoUrl: form.logo_url
    });
  } catch (error) {
    console.error('Get public form error:', error);
    res.status(500).json({ error: 'Failed to fetch form' });
  }
});

export default router;

