// routes/shop.js
import express from "express";
import db from "../db.js";

const router = express.Router();

// GET all available devices for clients
router.get("/", (req, res) => {
  db.all(
    "SELECT id, brand, model, grade, price FROM devices WHERE status = 'done' AND grade IS NOT NULL",
    [],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Database error");
      }
      res.render("shop/list", { devices: rows });
    }
  );
});

export default router;
