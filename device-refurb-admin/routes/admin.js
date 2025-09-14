import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const status = ['intake','wiping','wiped','resold'].includes(req.query.status) ? req.query.status : null;
  const q = req.query.q ? `%${req.query.q}%` : null;

  const rows = await db.all(`
    SELECT id, serial, model, status, grade, price, intake_date, COALESCE(notes,'') AS notes
    FROM devices
    WHERE (? IS NULL OR status = ?)
      AND (? IS NULL OR model LIKE ? OR serial LIKE ?)
    ORDER BY id DESC;
  `, [status, status, q, q, q]);

  res.render('devices/list', { devices: rows, filter: { status, q: req.query.q || '' } });
});

// Update from dashboard form
router.post('/:id/update', async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send('Auth required (?pass=...)');
  const { status, grade, price, notes } = req.body;
  await db.run(`
    UPDATE devices
    SET status = ?, grade = ?, price = ?, notes = ?
    WHERE id = ?;
  `, [status, grade || null, price ? Number(price) : null, notes || null, req.params.id]);
  res.redirect('/admin?pass=' + process.env.ADMIN_PASS);
});

// Quick status updates
router.post('/:id/status', async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send('Auth required');
  const { status } = req.body;
  await db.run(`UPDATE devices SET status=? WHERE id=?;`, [status, req.params.id]);
  res.redirect('/devices?status=' + status + '&pass=' + process.env.ADMIN_PASS);
});

// Grade
router.post('/:id/grade', async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send('Auth required');
  const { grade } = req.body;
  await db.run(`UPDATE devices SET grade=? WHERE id=?;`, [grade, req.params.id]);
  res.redirect('/devices?status=wiped&pass=' + process.env.ADMIN_PASS);
});

// Resell
router.post('/:id/resell', async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send('Auth required');
  const { price } = req.body;
  await db.run(`UPDATE devices SET status='resold', price=? WHERE id=?;`, [price ? Number(price) : null, req.params.id]);
  res.redirect('/devices?status=resold&pass=' + process.env.ADMIN_PASS);
});

export default router;
