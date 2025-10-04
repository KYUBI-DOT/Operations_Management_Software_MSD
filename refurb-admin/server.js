// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import dotenv from "dotenv";
import methodOverride from "method-override";
import session from "express-session";
import bcrypt from "bcrypt";

import db from "./db.js";
import revenueRoutes from "./routes/revenue.js";
import shopRoutes from "./routes/shop.js";
import devicesRoutes from "./routes/devices.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

// -------------------------------
// Views + Static
// -------------------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// -------------------------------
// Middleware
// -------------------------------
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd, // set true when behind HTTPS
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  })
);

// expose helpers to EJS
app.use((req, res, next) => {
  res.locals.cacheBuster = Date.now();
  res.locals.isAuthed = !!req.session.user;
  res.locals.user = req.session.user || null;
  // legacy helper (no longer used for auth, but keeps existing templates intact)
  res.locals.adminQS = "";
  next();
});

// -------------------------------
// Auth helpers
// -------------------------------
function requireAuth(req, res, next) {
  if (!req.session.user) {
    const nextUrl = encodeURIComponent(req.originalUrl || "/dashboard");
    return res.redirect(`/login?next=${nextUrl}`);
  }
  next();
}

// -------------------------------
// Public pages
// -------------------------------
app.get("/", (_req, res) =>
  res.render("home/index", { title: "Asset Lifecycle Management", active: "home" })
);

app.use("/shop", shopRoutes);

// -------------------------------
// Login / Logout
// -------------------------------
app.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");
  res.render("auth/login", {
    title: "Admin Login",
    active: "login",
    next: req.query.next || "",
    error: null,
  });
});

app.post("/login", async (req, res) => {
  const { username = "", password = "", next: nextUrl = "" } = req.body;

  const okUser = username.trim() === (process.env.ADMIN_USER || "admin");
  const okPass =
    !!process.env.ADMIN_PASS_HASH &&
    (await bcrypt.compare(password, process.env.ADMIN_PASS_HASH));

  if (!okUser || !okPass) {
    return res.status(401).render("auth/login", {
      title: "Admin Login",
      active: "login",
      next: nextUrl,
      error: "Invalid credentials",
    });
  }

  req.session.user = { name: username.trim() };
  return res.redirect(nextUrl || "/dashboard");
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// -------------------------------
// Admin-only routes
// -------------------------------
app.use("/devices", requireAuth, devicesRoutes);
app.use("/revenue", requireAuth, revenueRoutes);

// Dashboard (admin)
app.get("/dashboard", requireAuth, async (_req, res) => {
  try {
    const counts = await db.all(`
      SELECT status, COUNT(*) AS total
      FROM devices
      GROUP BY status
    `);
    const map = Object.fromEntries(counts.map((c) => [c.status, Number(c.total)]));

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

// -------------------------------
// Server
// -------------------------------
app.listen(PORT, () =>
  console.log(`🚀 Refurb Admin running at http://localhost:${PORT}`)
);
