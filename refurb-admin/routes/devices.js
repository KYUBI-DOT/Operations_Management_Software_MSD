// routes/devices.js
import { Router } from "express";
import db from "../db.js";

const router = Router();

/** List + filters (GET /devices) */
router.get("/", async (req, res) => {
  try {
    const status = ["pending", "in_progress", "done", "resold"].includes(req.query.status)
      ? req.query.status
      : null;

    const q = req.query.q ? `%${req.query.q}%` : null;

    const rows = await db.all(
      `
      SELECT * FROM devices
      WHERE (? IS NULL OR status = ?)
        AND (? IS NULL OR serial LIKE ? OR model LIKE ? OR brand LIKE ?)
      ORDER BY id DESC
      `,
      [status, status, q, q, q, q]
    );

    res.render("devices/list", {
      devices: rows || [],
      filter: { status, q: req.query.q || "" },
    });
  } catch (err) {
    console.error("List error:", err);
    res.status(500).send("Database error");
  }
});

/** New (GET /devices/new) */
router.get("/new", (_req, res) => {
  res.render("devices/new");
});

/** Create (POST /devices) */
router.post("/", async (req, res) => {
  try {
    const { serial, model, notes } = req.body;
    await db.run(
      `INSERT INTO devices (serial, brand, model, intake_date, status, notes)
       VALUES (?, NULL, ?, DATE('now'), 'pending', ?)`,
      [serial || null, model || null, notes || null]
    );
    res.redirect(`/devices?status=pending`);
  } catch (err) {
    console.error("Create error:", err);
    res.status(500).send("Database error");
  }
});

/** Edit (GET /devices/:id/edit) */
router.get("/:id/edit", async (req, res) => {
  try {
    const row = await db.get(`SELECT * FROM devices WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).send("Not found");
    res.render("devices/edit", { d: row });
  } catch (err) {
    console.error("Edit get error:", err);
    res.status(500).send("Database error");
  }
});

/** Update status (POST /devices/:id/status) */
router.post("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "in_progress", "done", "resold"].includes(status)) {
      return res.status(400).send("Bad status");
    }
    await db.run(`UPDATE devices SET status = ? WHERE id = ?`, [status, req.params.id]);
    res.redirect(`/devices?status=${status}`);
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).send("Database error");
  }
});

/** Set grade (POST /devices/:id/grade) */
router.post("/:id/grade", async (req, res) => {
  try {
    const { grade } = req.body;
    if (!["A", "B", "C"].includes(grade)) return res.status(400).send("Bad grade");
    await db.run(`UPDATE devices SET grade = ? WHERE id = ?`, [grade, req.params.id]);
    res.redirect(`/devices`);
  } catch (err) {
    console.error("Grade set error:", err);
    res.status(500).send("Database error");
  }
});

/** Resell (POST /devices/:id/resell) */
router.post("/:id/resell", async (req, res) => {
  try {
    const price = req.body.price ? Number(req.body.price) : null;
    await db.run(
      `UPDATE devices
       SET status='resold', price=?
       WHERE id=?`,
      [price, req.params.id]
    );
    res.redirect(`/devices?status=resold`);
  } catch (err) {
    console.error("Resell error:", err);
    res.status(500).send("Database error");
  }
});

/** Delete (POST /devices/:id/delete) */
router.post("/:id/delete", async (req, res) => {
  try {
    await db.run(`DELETE FROM devices WHERE id = ?`, [req.params.id]);
    res.redirect(`/devices`);
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).send("Database error");
  }
});

export default router;
