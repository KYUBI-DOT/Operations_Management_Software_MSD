// scripts/resetDb.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const dbPath = process.env.DATABASE_PATH || "./data/accesspass.db";
const dbDir  = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

async function reset() {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  await db.exec(`
    PRAGMA foreign_keys = ON;

    DROP TABLE IF EXISTS requests;

    /* Canonical schema used by routes:
       - employee_name TEXT
       - email TEXT
       - system TEXT
       - reason TEXT (optional)
       - status: pending | approved | denied | revoked
       - created_at TEXT (ISO date)
       - decided_at TEXT (optional)
       - decision_notes TEXT (optional)
    */
    CREATE TABLE requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_name TEXT NOT NULL,
      email         TEXT NOT NULL,
      system        TEXT NOT NULL,
      reason        TEXT,
      status        TEXT NOT NULL CHECK(status IN ('pending','approved','denied','revoked')) DEFAULT 'pending',
      created_at    TEXT NOT NULL DEFAULT (DATE('now')),
      decided_at    TEXT,
      decision_notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
    CREATE INDEX IF NOT EXISTS idx_requests_system ON requests(system);
  `);

  // Seed sample data (matches the schema above)
  await db.run(
    `INSERT INTO requests (employee_name,email,system,reason,status,created_at,decided_at,decision_notes)
     VALUES (?,?,?,?,?,?,?,?)`,
    ["Priya Kumar","priya@corp.com","GitHub","New project repo","pending","2025-09-10", null, null]
  );
  await db.run(
    `INSERT INTO requests (employee_name,email,system,reason,status,created_at,decided_at,decision_notes)
     VALUES (?,?,?,?,?,?,?,?)`,
    ["Alex Tan","alex@corp.com","Jira","Backlog access","approved","2025-09-08","2025-09-09","Approved for project A"]
  );
  await db.run(
    `INSERT INTO requests (employee_name,email,system,reason,status,created_at,decided_at,decision_notes)
     VALUES (?,?,?,?,?,?,?,?)`,
    ["Sara Lee","sara@corp.com","VPN","Remote work","denied","2025-09-05","2025-09-06","Need manager approval"]
  );
  await db.run(
    `INSERT INTO requests (employee_name,email,system,reason,status,created_at,decided_at,decision_notes)
     VALUES (?,?,?,?,?,?,?,?)`,
    ["John Kim","john@corp.com","GitHub","PR reviews","approved","2025-09-01","2025-09-02","OK"]
  );
  await db.run(
    `INSERT INTO requests (employee_name,email,system,reason,status,created_at,decided_at,decision_notes)
     VALUES (?,?,?,?,?,?,?,?)`,
    ["Maya Roy","maya@corp.com","Jira","Read-only board","revoked","2025-08-20","2025-09-01","Contract ended"]
  );

  console.log("✅ Database reset and seeded.");
  await db.close();
}

reset().catch((e) => {
  console.error("❌ Reset failed:", e);
  process.exit(1);
});
