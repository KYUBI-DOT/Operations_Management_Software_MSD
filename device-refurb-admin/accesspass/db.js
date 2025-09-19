import sqlite3 from "sqlite3";
import { open } from "sqlite";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const dbPath = process.env.DATABASE_PATH || "./data/accesspass.db";
const db = await open({ filename: dbPath, driver: sqlite3.Database });

await db.exec(`
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_name TEXT NOT NULL,
  email TEXT NOT NULL,
  system TEXT NOT NULL, -- e.g., GitHub, Jira, VPN
  reason TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending','approved','denied','revoked')) DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (DATE('now')),
  decided_at TEXT,
  decision_notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_system ON requests(system);
`);

export default db;
