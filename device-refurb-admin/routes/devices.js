import express from "express";
import db from "../db.js";

const router = express.Router();

// List all devices
router.get("/", (req, res) => {
  const devices = db.prepare("SELECT * FROM devices").all();
  res.render("devices/list", { devices });
});

// Update device status/grade
router.post("/:id/update", (req, res) => {
  const { status, grade, price, notes } = req.body;
  db.prepare(
    "UPDATE devices SET status=?, grade=?, price=?, notes=? WHERE id=?"
  ).run(status, grade || null, price || null, notes || null, req.params.id);
  res.redirect("/admin?pass=" + process.env.ADMIN_PASS);
});

export default router;
