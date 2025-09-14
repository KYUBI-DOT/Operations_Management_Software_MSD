// routes/revenue.js
import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  if (!res.locals.isAuthed) {
    return res.status(403).send("Auth required (?pass=...)");
  }

  // KPIs
  const totals = await db.get(`
    SELECT
      COUNT(*)                  AS sold_count,
      COALESCE(SUM(price), 0)  AS total_revenue,
      COALESCE(AVG(price), 0)  AS avg_price
    FROM devices
    WHERE status = 'resold' AND price IS NOT NULL;
  `);

  // Group revenue by month (using intake_date as proxy for sale month)
  const rows = await db.all(`
    SELECT
      strftime('%Y-%m', intake_date) AS ym,
      COALESCE(SUM(price), 0)        AS revenue,
      COUNT(*)                        AS sold
    FROM devices
    WHERE status = 'resold' AND price IS NOT NULL
    GROUP BY ym
    ORDER BY ym ASC;
  `);

  const labels = rows.map(r => r.ym);
  const revenue = rows.map(r => Number(r.revenue));
  const sold = rows.map(r => r.sold);

  let bestMonth = null;
  if (rows.length) {
    bestMonth = rows.reduce((a, b) => (Number(a.revenue) >= Number(b.revenue) ? a : b));
  }

  res.render("revenue/index", {
    kpi: {
      soldCount: totals?.sold_count || 0,
      totalRevenue: Number(totals?.total_revenue || 0),
      avgPrice: Number(totals?.avg_price || 0),
      bestMonth
    },
    chart: { labels, revenue, sold }
  });
});

export default router; // ← IMPORTANT
