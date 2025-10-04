// routes/devices.js
import { Router } from "express";
import db from "../db.js";

const router = Router();

// Helper to append ?pass=... safely to a URL that may already have query params
function withAdminQS(res, baseUrl) {
  const hasQuery = baseUrl.includes("?");
  return res.locals.adminQS
    ? baseUrl + (hasQuery ? "&" : "?") + res.locals.adminQS.slice(1)
    : baseUrl;
}

// LIST: GET /devices[?q=...&status=...]
router.get("/", async (req, res) => {
  try {
    const status = ["pending", "in_progress", "done", "resold"].includes(req.query.status)
      ? req.query.status
      : "";
    const qRaw = req.query.q || "";
    const q = qRaw ? `%${qRaw}%` : null;

    const rows = await db.all(
      `
      SELECT id, serial, brand, model, status, grade, price, intake_date
      FROM devices
      WHERE (? = '' OR status = ?)
        AND (? IS NULL OR serial LIKE ? OR model LIKE ? OR brand LIKE ?)
      ORDER BY id DESC
      `,
      [status, status, q, q, q, q]
    );

    res.render("devices/list", {
      title: "Devices",
      devices: rows || [],
      filter: { status, q: qRaw }
    });
  } catch (err) {
    console.error("List error:", err);
    res.status(500).send("Database error");
  }
});

// Back-compat: /devices/list -> redirect to /devices with same filters
router.get("/list", (req, res) => {
  const qs = new URLSearchParams(req.query).toString(); // keeps status & q
  const base = `/devices${qs ? `?${qs}` : ""}`;
  return res.redirect(withAdminQS(res, base));
});

// NEW (GET /devices/new)
router.get("/new", (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required (?pass=...)");
  res.render("devices/new");
});

// CREATE (POST /devices)
router.post("/", async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required");
  try {
    const { serial, brand, model, notes } = req.body;
    await db.run(
      `INSERT INTO devices (serial, brand, model, intake_date, status, notes)
       VALUES (?, ?, ?, DATE('now'), 'pending', ?)`,
      [serial || null, brand || null, model, notes || null]
    );
    const to = withAdminQS(res, "/devices?status=pending");
    return res.redirect(to);
  } catch (err) {
    console.error("Create error:", err);
    res.status(500).send("Database error");
  }
});

// EDIT (GET /devices/:id/edit)
router.get("/:id/edit", async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required");
  try {
    const row = await db.get(`SELECT * FROM devices WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).send("Not found");
    res.render("devices/edit", { d: row });
  } catch (err) {
    console.error("Edit get error:", err);
    res.status(500).send("Database error");
  }
});

// UPDATE STATUS (POST /devices/:id/status)
router.post("/:id/status", async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required");
  try {
    const { status } = req.body;
    if (!["pending","in_progress","done","resold"].includes(status)) {
      return res.status(400).send("Bad status");
    }
    await db.run(`UPDATE devices SET status = ? WHERE id = ?`, [status, req.params.id]);
    const to = withAdminQS(res, `/devices?status=${encodeURIComponent(status)}`);
    return res.redirect(to);
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).send("Database error");
  }
});

// SET GRADE (POST /devices/:id/grade)
router.post("/:id/grade", async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required");
  try {
    const { grade } = req.body;
    if (!["A","B","C"].includes(grade)) return res.status(400).send("Bad grade");
    await db.run(`UPDATE devices SET grade = ? WHERE id = ?`, [grade, req.params.id]);
    const to = withAdminQS(res, "/devices");
    return res.redirect(to);
  } catch (err) {
    console.error("Grade set error:", err);
    res.status(500).send("Database error");
  }
});

// RESELL (POST /devices/:id/resell)
router.post("/:id/resell", async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required");
  try {
    const price = req.body.price ? Number(req.body.price) : null;
    await db.run(
      `UPDATE devices
         SET status='resold', price=?
       WHERE id=?`,
      [price, req.params.id]
    );
    const to = withAdminQS(res, "/devices?status=resold");
    return res.redirect(to);
  } catch (err) {
    console.error("Resell error:", err);
    res.status(500).send("Database error");
  }
});

// DELETE (POST /devices/:id/delete)
router.post("/:id/delete", async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required");
  try {
    await db.run(`DELETE FROM devices WHERE id = ?`, [req.params.id]);
    const to = withAdminQS(res, "/devices");
    return res.redirect(to);
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).send("Database error");
  }
});

export default router;
