import { Router } from "express";
import db from "../db.js";
const router = Router();

router.get("/", async (req, res) => {
  const counts = await db.all(`SELECT status, COUNT(*) total FROM requests GROUP BY status;`);
  const map = Object.fromEntries(counts.map(c => [c.status, c.total]));
  const latest = await db.all(`SELECT * FROM requests ORDER BY id DESC LIMIT 8;`);
  res.render("index", { stats: {
    pending: map.pending || 0,
    approved: map.approved || 0,
    denied: map.denied || 0,
    revoked: map.revoked || 0
  }, latest });
});

export default router;
