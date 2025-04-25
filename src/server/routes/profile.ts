import { Router } from 'express';
import { db } from '../db/client';
const router = Router();

// Upsert user full name
router.post('/', async (req, res) => {
  const uid = (req as any).uid;
  const { fullName } = req.body;
  try {
    await db.query(
      `INSERT INTO users (firebase_uid, full_name)
       VALUES ($1, $2)
       ON CONFLICT (firebase_uid) DO UPDATE
         SET full_name = EXCLUDED.full_name`,
      [uid, fullName]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Fetch user profile
router.get('/', async (req, res) => {
  const uid = (req as any).uid;
  const { rows } = await db.query(
    `SELECT full_name, created_at FROM users WHERE firebase_uid = $1`,
    [uid]
  );
  res.json(rows[0] || null);
});

export default router;