import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/submissions/:formId - Get all submissions for a form
router.get('/:formId', authenticateToken, async (req, res) => {
  try {
    const { formId } = req.params;

    // Verify form ownership
    const formCheck = await pool.query(
      'SELECT id FROM forms WHERE id = $1 AND user_id = $2',
      [formId, req.user.userId]
    );

    if (formCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found or access denied' });
    }

    const result = await pool.query(
      'SELECT id, form_id, answers, submitted_at FROM submissions WHERE form_id = $1 ORDER BY submitted_at DESC',
      [formId]
    );

    const submissions = result.rows.map(row => ({
      id: row.id.toString(),
      formId: row.form_id.toString(),
      answers: row.answers,
      submittedAt: row.submitted_at.toISOString()
    }));

    res.json(submissions);
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// POST /api/submissions - Create new submission (public endpoint - no auth required)
router.post('/', async (req, res) => {
  try {
    const { formId, answers } = req.body;

    if (!formId || !answers) {
      return res.status(400).json({ error: 'Form ID and answers are required' });
    }

    // Verify form exists
    const formCheck = await pool.query('SELECT id FROM forms WHERE id = $1', [formId]);

    if (formCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Insert submission
    const result = await pool.query(
      'INSERT INTO submissions (form_id, answers) VALUES ($1, $2) RETURNING id, form_id, answers, submitted_at',
      [formId, JSON.stringify(answers)]
    );

    // Update form response count
    await pool.query(
      'UPDATE forms SET response_count = response_count + 1 WHERE id = $1',
      [formId]
    );

    const submission = result.rows[0];

    res.status(201).json({
      id: submission.id.toString(),
      formId: submission.form_id.toString(),
      answers: submission.answers,
      submittedAt: submission.submitted_at.toISOString()
    });
  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

export default router;

