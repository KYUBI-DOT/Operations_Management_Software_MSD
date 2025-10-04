// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import dotenv from "dotenv";
import methodOverride from "method-override";

import db from "./db.js"; // for dashboard stats
import revenueRoutes from "./routes/revenue.js";
import shopRoutes from "./routes/shop.js";
import devicesRoutes from "./routes/devices.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------------------
// Views + Static Assets
// -------------------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public"))); // serves /style.css, /images/*

// -------------------------------
// Middleware
// -------------------------------
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

// Expose globals to EJS (legacy demo auth via ?pass=)
app.use((req, res, next) => {
  res.locals.cacheBuster = Date.now();
  res.locals.adminQS = process.env.ADMIN_PASS
    ? `?pass=${encodeURIComponent(process.env.ADMIN_PASS)}`
    : "";
  res.locals.isAuthed =
    (req.query.pass && req.query.pass === process.env.ADMIN_PASS) || false;
  next();
});

// -------------------------------
// Public pages
// -------------------------------
// Home page (public)
app.get("/", (req, res) => {
  res.render("home/index", { title: "Welcome", active: "home" });
});

// Shop (public)
app.use("/shop", shopRoutes);

// -------------------------------
// Protect Admin Routes (temporary ?pass=)
// -------------------------------
app.use(["/devices", "/revenue", "/dashboard"], (req, res, next) => {
  if (!res.locals.isAuthed) return res.redirect(`/shop${res.locals.adminQS}`);
  next();
});

// -------------------------------
// Admin Dashboard (with live data)
// -------------------------------
app.get("/dashboard", async (req, res) => {
  if (!res.locals.isAuthed) return res.redirect(`/shop${res.locals.adminQS}`);

  try {
    const counts = await db.all(`
      SELECT status, COUNT(*) AS total
      FROM devices
      GROUP BY status
    `);
    const map = Object.fromEntries(counts.map(c => [c.status, Number(c.total)]));

    const latest = await db.all(`
      SELECT id, serial, brand, model, status, grade, price, intake_date
      FROM devices
      ORDER BY id DESC
      LIMIT 8
    `);

    res.render("admin/dashboard", {
      title: "Admin Dashboard",
      active: "dashboard",
      stats: {
        pending: map.pending || 0,
        in_progress: map.in_progress || 0,
        done: map.done || 0,
        resold: map.resold || 0
      },
      latest: latest || []
    });
  } catch (err) {
    console.error("Dashboard load error:", err);
    res.status(500).send("Database error");
  }
});

// -------------------------------
// Admin feature routes
// -------------------------------
app.use("/revenue", revenueRoutes);
app.use("/devices", devicesRoutes);

// -------------------------------
// Server Start
// -------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Refurb Admin running at http://localhost:${PORT}`);
});
