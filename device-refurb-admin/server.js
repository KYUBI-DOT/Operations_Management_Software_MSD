// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.get("/", (req, res) => {
  res.send(" Device Refurb Admin App is running!");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
