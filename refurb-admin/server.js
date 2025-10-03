// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import dotenv from "dotenv";
import methodOverride from "method-override";
import revenueRoutes from "./routes/revenue.js"
import shopRoutes from "./routes/shop.js";


import devicesRoutes from "./routes/devices.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// views + static
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// middleware
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));


// landing → client shop
app.get("/", (req, res) => res.redirect("/shop"));


// simple demo auth (URL param ?pass=...)
app.use((req, res, next) => {
  res.locals.isAuthed =
    (req.query.pass && req.query.pass === process.env.ADMIN_PASS) || false;
  next();
});

// routes
app.use("/shop", shopRoutes);
app.use("/revenue", revenueRoutes);
app.use("/devices", devicesRoutes);  



app.listen(PORT, () =>
  console.log(`🚀 Refurb Admin running at http://localhost:${PORT}`)
);
