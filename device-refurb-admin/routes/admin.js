import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  // Optional: show a friendly message if not authed
  if (!res.locals.isAuthed) {
    return res.render("admin/dashboard", {
      stats: { intake: 0, wiping: 0, wiped: 0, resold: 0 },
      latest: [],
      authHint: true,
    });
  }

  const counts = await db.all(
    `SELECT status, COUNT(*) AS total FROM devices GROUP BY status;`
  );
  const map = Object.fromEntries(counts.map((c) => [c.status, c.total]));
  const stats = {
    intake: map.intake || 0,
    wiping: map.wiping || 0,
    wiped: map.wiped || 0,
    resold: map.resold || 0,
  };

  const latest = await db.all(`
    SELECT id, serial, model, status, grade, price, intake_date
    FROM devices
    ORDER BY id DESC
    LIMIT 8;
  `);

  res.render("admin/dashboard", { stats, latest, authHint: false });
});

export default router;
