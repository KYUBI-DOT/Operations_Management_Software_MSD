import { Router } from "express";
import db from "../db.js";

const router = Router();

// list + filters
router.get("/", async (req, res) => {
  const status = ["intake", "wiping", "wiped", "resold"].includes(req.query.status)
    ? req.query.status
    : null;
  const q = req.query.q ? `%${req.query.q}%` : null;

  const rows = await db.all(
    `
    SELECT id, serial, model, status, grade, price, intake_date, COALESCE(notes,'') as notes
    FROM devices
    WHERE (? IS NULL OR status = ?)
      AND (? IS NULL OR model LIKE ? OR serial LIKE ?)
    ORDER BY id DESC;
  `,
    [status, status, q, q, q]
  );

  res.render("devices/list", {
    devices: rows,
    filter: { status, q: req.query.q || "" },
  });
});

// new form
router.get("/new", (req, res) => {
  res.render("devices/new");
});

// create
router.post("/", async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required (?pass=...)");
  const { serial, model, intake_date, notes } = req.body;
  await db.run(
    `
    INSERT INTO devices (serial, model, intake_date, status, notes)
    VALUES (?, ?, ?, 'intake', ?);
  `,
    [serial, model, intake_date, notes || null]
  );
  res.redirect("/devices?status=intake&pass=" + process.env.ADMIN_PASS);
});

// edit form
router.get("/:id/edit", async (req, res) => {
  const row = await db.get(`SELECT * FROM devices WHERE id=?;`, [req.params.id]);
  if (!row) return res.status(404).send("Not found");
  res.render("devices/edit", { d: row });
});

// update
router.post("/:id/update", async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required");
  const { serial, model, intake_date, status, grade, price, notes } = req.body;
  await db.run(
    `
    UPDATE devices
    SET serial=?, model=?, intake_date=?, status=?, grade=?, price=?, notes=?
    WHERE id=?;
  `,
    [
      serial,
      model,
      intake_date,
      status,
      grade || null,
      price ? Number(price) : null,
      notes || null,
      req.params.id,
    ]
  );
  res.redirect("/devices?pass=" + process.env.ADMIN_PASS);
});

// quick status
router.post("/:id/status", async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required");
  const { status } = req.body;
  await db.run(`UPDATE devices SET status=? WHERE id=?;`, [status, req.params.id]);
  res.redirect(`/devices?status=${status}&pass=${process.env.ADMIN_PASS}`);
});

// set grade (only when wiped)
router.post("/:id/grade", async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required");
  const { grade } = req.body;
  await db.run(`UPDATE devices SET grade=? WHERE id=?;`, [grade, req.params.id]);
  res.redirect(`/devices?status=wiped&pass=${process.env.ADMIN_PASS}`);
});

// resell (sets status=resold + price)
router.post("/:id/resell", async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required");
  const { price } = req.body;
  await db.run(`UPDATE devices SET status='resold', price=? WHERE id=?;`, [
    price ? Number(price) : null,
    req.params.id,
  ]);
  res.redirect(`/devices?status=resold&pass=${process.env.ADMIN_PASS}`);
});

// delete
router.post("/:id/delete", async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required");
  await db.run(`DELETE FROM devices WHERE id=?;`, [req.params.id]);
  res.redirect(`/devices?pass=${process.env.ADMIN_PASS}`);
});

export default router;
