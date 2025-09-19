// routes/revenue.js
import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  if (!res.locals.isAuthed) return res.status(403).send("Auth required (?pass=...)");

  // KPIs
  const k = await db.get(`
    SELECT
      COUNT(*)                        AS sold_count,
      COALESCE(SUM(price), 0)         AS total_revenue,
      COALESCE(AVG(price), 0)         AS avg_price
    FROM devices
    WHERE status='resold' AND price IS NOT NULL;
  `);

  // Monthly revenue grouped by resold_at (fallback to intake_date)
  const rows = await db.all(`
    SELECT
      strftime('%Y-%m', COALESCE(resold_at, intake_date)) AS ym,
      COALESCE(SUM(price), 0) AS revenue,
      COUNT(*)               AS sold
    FROM devices
    WHERE status='resold' AND price IS NOT NULL
    GROUP BY ym
    ORDER BY ym ASC;
  `);

  const labels  = rows.map(r => r.ym);
  const revenue = rows.map(r => Number(r.revenue));
  const units   = rows.map(r => r.sold);

  let bestMonth = null;
  if (rows.length) {
    bestMonth = rows.reduce((a, b) => (Number(a.revenue) >= Number(b.revenue) ? a : b));
  }

  // Grade breakdown of resold devices
  const grades = await db.all(`
    SELECT grade, COUNT(*) AS cnt
    FROM devices
    WHERE status='resold'
    GROUP BY grade;
  `);
  const gradeLabels = ["A","B","C"];
  const gradeData   = gradeLabels.map(g => {
    const row = grades.find(x => x.grade === g);
    return row ? row.cnt : 0;
  });

  res.render("revenue/index", {
    kpi: {
      soldCount: k?.sold_count || 0,
      totalRevenue: Number(k?.total_revenue || 0),
      avgPrice: Number(k?.avg_price || 0),
      bestMonth
    },
    chart: { labels, revenue, units },
    grade: { labels: gradeLabels, data: gradeData }
  });
});

export default router;
