import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const dbPath = process.env.DATABASE_PATH || './data/devices.db';
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.exec(`
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
