// scripts/resetDb.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const dbPath = process.env.DATABASE_PATH || "./data/devices.db";
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = await open({ filename: dbPath, driver: sqlite3.Database });

await db.exec(`
  PRAGMA foreign_keys = ON;

  DROP TABLE IF EXISTS devices;

  CREATE TABLE devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serial TEXT,
    brand TEXT,
    model TEXT NOT NULL,
    intake_date TEXT,
    status TEXT NOT NULL CHECK(status IN ('pending','in_progress','done','resold')),
    grade TEXT CHECK(grade IN ('A','B','C')),
    price REAL,
    notes TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
  CREATE INDEX IF NOT EXISTS idx_devices_grade ON devices(grade);
`);

const today = new Date().toISOString().slice(0, 10);

// ✅ Seed sample devices
await db.run(
  `INSERT INTO devices (serial, brand, model, intake_date, status, grade, price, notes)
   VALUES ('SN-1001','Apple','iPhone 12','${today}','done','A',500,'Screen perfect')`
);

await db.run(
  `INSERT INTO devices (serial, brand, model, intake_date, status, grade, price, notes)
   VALUES ('SN-1002','Samsung','Galaxy S21','${today}','in_progress',NULL,NULL,'Wipe started')`
);

await db.run(
  `INSERT INTO devices (serial, brand, model, intake_date, status, grade, price, notes)
   VALUES ('SN-1003','Dell','XPS 13','${today}','pending',NULL,NULL,'Awaiting wipe')`
);

await db.run(
  `INSERT INTO devices (serial, brand, model, intake_date, status, grade, price, notes)
   VALUES ('SN-1004','Apple','iPad Air','${today}','resold','B',320,'Minor scratches')`
);

await db.run(
  `INSERT INTO devices (serial, brand, model, intake_date, status, grade, price, notes)
   VALUES ('SN-1005','Apple','MacBook Pro','${today}','done','A',1500,'Like new')`
);

console.log("✅ Database reset and seeded.");
await db.close();
