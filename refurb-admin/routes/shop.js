// routes/shop.js
import express from "express";
import db from "../db.js";

const router = express.Router();

// works with sqlite3 callback or sqlite promise API
async function queryAll(sql, params = []) {
  const maybe = db.all(sql, params);
  if (maybe && typeof maybe.then === "function") return await maybe;
  return await new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)))
  );
}

// Public shop – show items ready to buy (done + graded)
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
      active: "shop",
      devices: rows || [],
    });
  } catch (err) {
    console.error("Shop query error:", err);
    res.status(500).send("Database error");
  }
});

export default router;
