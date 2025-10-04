// routes/shop.js
import express from "express";
import db from "../db.js";

const router = express.Router();

/**
 * Query helper that works with either:
 *  - sqlite3 callback API (db.all(sql, params, cb))
 *  - sqlite promise API (await db.all(sql, params))
 */
async function queryAll(sql, params = []) {
  const maybe = db.all(sql, params);
  if (maybe && typeof maybe.then === "function") {
    return await maybe; // sqlite promise API
  }
  return await new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

// GET /shop — public catalog: only sellable devices
router.get("/", async (_req, res) => {
  try {
    const rows = await queryAll(
      `
      SELECT id, brand, model, grade, price
      FROM devices
      WHERE status = 'done' AND grade IS NOT NULL
      ORDER BY grade ASC, price DESC
      `
    );

    res.render("shop/list", {
      title: "Shop",
      active: "shop",  // header highlight
      items: rows || []
    });
  } catch (err) {
    console.error("Shop query error:", err);
    res.status(500).send("Database error");
  }
});

export default router;
