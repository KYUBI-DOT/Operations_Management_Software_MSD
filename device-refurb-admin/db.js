import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const dbPath = process.env.DATABASE_PATH || './data/devices.db';

// Open a single shared connection
const db = await open({
  filename: dbPath,
  driver: sqlite3.Database,
});

// Schema
await db.exec(`
CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  serial TEXT NOT NULL,
  model TEXT NOT NULL,
  intake_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('intake','wiping','wiped','resold')),
  grade TEXT CHECK(grade IN ('A','B','C')),
  price REAL,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_model ON devices(model);
`);

export default db;

