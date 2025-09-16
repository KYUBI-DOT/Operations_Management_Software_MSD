import { Router } from "express";
import db from "../db.js";
const router = Router();

// list + filters
router.get("/", async (req, res) => {
  const status = ["pending","approved","denied","revoked"].includes(req.query.status) ? req.query.status : null;
  const q = req.query.q ? `%${req.query.q}%` : null;

  const rows = await db.all(`
    SELECT * FROM requests
    WHERE (? IS NULL OR status = ?)
      AND (? IS NULL OR employee_name LIKE ? OR email LIKE ? OR system LIKE ?)
    ORDER BY id DESC;
  `, [status, status, q, q, q, q]);

  res.render("requests/list", { rows, filter: { status, q: req.query.q || "" } });
});

// new
router.get("/new", (req, res) => res.render("requests/new"));

// create
router.post("/", async (req, res) => {
  const { employee_name, email, system, reason } = req.body;
  await db.run(`INSERT INTO requests (employee_name,email,system,reason) VALUES (?,?,?,?);`,
    [employee_name, email, system, reason || null]);
  res.redirect("/requests?status=pending");
});

// edit
router.get("/:id/edit", async (req, res) => {
  const row = await db.get(`SELECT * FROM requests WHERE id = ?;`, [req.params.id]);
  if (!row) return res.status(404).send("Not found");
  res.render("requests/edit", { r: row });
});

// decision
router.post("/:id/decide", async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required");
  const { status, decision_notes } = req.body; // approved/denied/revoked
  await db.run(`
    UPDATE requests SET status=?, decided_at=DATE('now'), decision_notes=? WHERE id=?;
  `, [status, decision_notes || null, req.params.id]);
  res.redirect(`/requests?status=${status}`);
});

// delete
router.post("/:id/delete", async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required");
  await db.run(`DELETE FROM requests WHERE id=?;`, [req.params.id]);
  res.redirect("/requests");
});

// export CSV (approved only)
router.get("/export/csv", async (_req, res) => {
  const rows = await db.all(`SELECT employee_name,email,system,decided_at FROM requests WHERE status='approved';`);
  const header = "employee_name,email,system,decided_at";
  const csv = [header, ...rows.map(r => [r.employee_name,r.email,r.system,r.decided_at].join(","))].join("\n");
  res.setHeader("Content-Type","text/csv");
  res.setHeader("Content-Disposition","attachment; filename=approved_access.csv");
  res.send(csv);
});

export default router;
