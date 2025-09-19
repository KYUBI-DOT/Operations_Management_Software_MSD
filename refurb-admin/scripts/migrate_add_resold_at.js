// scripts/migrate_add_resold_at.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import dotenv from "dotenv";

dotenv.config();

const db = await open({
  filename: process.env.DATABASE_PATH || "./data/devices.db",
  driver: sqlite3.Database,
});

// 1) Add column if missing
await db.exec(`
  PRAGMA foreign_keys = OFF;
  BEGIN;

  -- If resold_at doesn't exist, add it
  CREATE TABLE IF NOT EXISTS _schema_guard (col TEXT);
  -- try selecting the column; if it errors, we'll catch below
`);
let needAlter = false;
try {
  await db.get(`SELECT resold_at FROM devices LIMIT 1`);
} catch {
  needAlter = true;
}

if (needAlter) {
  await db.exec(`ALTER TABLE devices ADD COLUMN resold_at TEXT;`);
}

// 2) Backfill for any existing resold rows that have no date
await db.run(
  `UPDATE devices
   SET resold_at = COALESCE(resold_at, intake_date)
   WHERE status='resold' AND (resold_at IS NULL OR resold_at='');`
);

await db.exec(`COMMIT; PRAGMA foreign_keys = ON;`);

console.log("✅ Migration complete (resold_at ensured & backfilled).");
await db.close();
