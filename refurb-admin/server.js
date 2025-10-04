// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import dotenv from "dotenv";
import methodOverride from "method-override";
import session from "express-session";

import db from "./db.js";
import revenueRoutes from "./routes/revenue.js";
import shopRoutes from "./routes/shop.js";
import devicesRoutes from "./routes/devices.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Views + static
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public"))); // /style.css, /home.css, /images/*

// Middleware
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

// Sessions (real auth)
app.use(
  session({
    name: "refurb.sid",
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 8 }, // 8h
  })
);

// Globals for views
app.use((req, res, next) => {
  res.locals.cacheBuster = Date.now();
  res.locals.isAuthed = Boolean(req.session?.isAuthed);
  res.locals.user = req.session?.user || null;
  next();
});

// Helper: guard admin routes
function requireAuth(req, res, next) {
  if (!req.session?.isAuthed) return res.redirect("/login");
  next();
}

// Public pages
app.get("/", (req, res) => {
  res.render("home/index", { title: "Welcome", active: "home" });
});
app.use("/shop", shopRoutes); // public

// Auth pages
app.get("/login", (req, res) => {
  if (req.session?.isAuthed) return res.redirect("/dashboard");
  res.render("auth/login", { title: "Admin Login" });
});
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const ok =
    username === (process.env.ADMIN_USER || "admin") &&
    password === (process.env.ADMIN_PASS || "changeme");

  if (!ok) {
    return res.status(401).render("auth/login", {
      title: "Admin Login",
      error: "Invalid credentials",
    });
  }
  req.session.isAuthed = true;
  req.session.user = { name: username };
  res.redirect("/dashboard");
});
app.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// Admin-only routes
app.use(["/devices", "/revenue", "/dashboard"], requireAuth);

// Dashboard (live data)
app.get("/dashboard", async (req, res) => {
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
        resold: map.resold || 0,
      },
      latest: latest || [],
    });
  } catch (err) {
    console.error("Dashboard load error:", err);
    res.status(500).send("Database error");
  }
});

// Feature routes (still work; they check res.locals.isAuthed which is set from session)
app.use("/revenue", revenueRoutes);
app.use("/devices", devicesRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Refurb Admin running at http://localhost:${PORT}`);
});
