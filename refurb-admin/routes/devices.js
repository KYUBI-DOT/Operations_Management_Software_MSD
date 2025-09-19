// routes/devices.js
import { Router } from "express";
import db from "../db.js";

const router = Router();

// Dashboard
router.get("/", async (req, res) => {
  const counts = await db.all(`
    SELECT status, COUNT(*) AS total FROM devices GROUP BY status
  `);
  const map = Object.fromEntries(counts.map(c => [c.status, c.total]));
  const latest = await db.all(`SELECT * FROM devices ORDER BY id DESC LIMIT 8`);
  res.render("admin/dashboard", {
    stats: {
      pending: map.pending || 0,
      in_progress: map.in_progress || 0,
      done: map.done || 0,
      resold: map.resold || 0
    },
    latest
  });
});

// List + filters
router.get("/devices", async (req, res) => {
  const status = ["pending","in_progress","done","resold"].includes(req.query.status) ? req.query.status : null;
  const q = req.query.q ? `%${req.query.q}%` : null;

  const rows = await db.all(`
    SELECT * FROM devices
    WHERE (? IS NULL OR status = ?)
      AND (? IS NULL OR serial LIKE ? OR model LIKE ?)
    ORDER BY id DESC
  `, [status, status, q, q, q]);

  res.render("devices/list", { devices: rows, filter: { status, q: req.query.q || "" } });
});

// New
router.get("/devices/new", (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required (?pass=...)");
  res.render("devices/new");
});

// Create
router.post("/devices", async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required");
  const { serial, model, notes } = req.body;
  await db.run(`INSERT INTO devices (serial, model, intake_date, status, notes)
                VALUES (?, ?, DATE('now'), 'pending', ?)`,
               [serial, model, notes || null]);
  res.redirect(`/devices?status=pending&pass=${process.env.ADMIN_PASS}`);
});

// Edit
router.get("/devices/:id/edit", async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required");
  const row = await db.get(`SELECT * FROM devices WHERE id = ?`, [req.params.id]);
  if (!row) return res.status(404).send("Not found");
  res.render("devices/edit", { d: row });
});

// Update status (pending/in_progress/done)
router.post("/devices/:id/status", async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required");
  const { status } = req.body;
  if (!["pending","in_progress","done","resold"].includes(status)) return res.status(400).send("Bad status");
  await db.run(`UPDATE devices SET status = ? WHERE id = ?`, [status, req.params.id]);
  res.redirect(`/devices?status=${status}&pass=${process.env.ADMIN_PASS}`);
});

// Set grade
router.post("/devices/:id/grade", async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required");
  const { grade } = req.body;
  if (!["A","B","C"].includes(grade)) return res.status(400).send("Bad grade");
  await db.run(`UPDATE devices SET grade = ? WHERE id = ?`, [grade, req.params.id]);
  res.redirect(`/devices?pass=${process.env.ADMIN_PASS}`);
});

// Resell (set price and mark resold)
router.post("/devices/:id/resell", async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required");
  const p = req.body.price ? Number(req.body.price) : null;
  await db.run(
    `UPDATE devices
     SET status='resold', price=?, resold_at=DATE('now')
     WHERE id=?`,
    [p, req.params.id]
  );
  res.redirect(`/devices?status=resold&pass=${process.env.ADMIN_PASS}`);
});


// Delete
router.post("/devices/:id/delete", async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required");
  await db.run(`DELETE FROM devices WHERE id = ?`, [req.params.id]);
  res.redirect(`/devices?pass=${process.env.ADMIN_PASS}`);
});

export default router;
