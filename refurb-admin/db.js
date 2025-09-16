// db.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import dotenv from "dotenv";

dotenv.config();

const db = await open({
  filename: process.env.DATABASE_PATH || "./data/devices.db",
  driver: sqlite3.Database
});

// Ensure schema exists
await db.exec(`
CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  serial TEXT NOT NULL,
  model TEXT NOT NULL,
  intake_date TEXT NOT NULL DEFAULT (DATE('now')),
  status TEXT NOT NULL CHECK(status IN ('pending','in_progress','done','resold')) DEFAULT 'pending',
  grade TEXT CHECK(grade IN ('A','B','C')),
  price REAL,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_grade ON devices(grade);
`);

export default db;

