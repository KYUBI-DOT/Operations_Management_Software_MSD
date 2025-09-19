// routes/analytics.js
import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

const router = express.Router();

// helper: open DB
async function getDb() {
  return open({
    filename: path.join(process.cwd(), "data", "accesspass.db"),
    driver: sqlite3.Database,
  });
}

// analytics dashboard
router.get("/", async (req, res) => {
  const db = await getDb();

  const metrics = await db.all("SELECT metric, value FROM analytics");
  await db.close();

  res.render("analytics/dashboard", { metrics });
});

export default router;
