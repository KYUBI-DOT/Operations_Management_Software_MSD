// scripts/resetDb.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resetDb() {
  const db = await open({
    filename: path.join(__dirname, "../data/devices.db"),
    driver: sqlite3.Database
  });

  // Drop + recreate
  await db.exec(`
    DROP TABLE IF EXISTS devices;
    CREATE TABLE devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serial TEXT NOT NULL,
      model TEXT NOT NULL,
      intake_date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('intake','wiping','wiped','resold')),
      grade TEXT CHECK(grade IN ('A','B','C')),
      price REAL,
      notes TEXT
    );
  `);

  // Seed sample data
  await db.run(`
    INSERT INTO devices (serial, model, intake_date, status, grade, price, notes)
    VALUES
      ('SN12345', 'iPhone 12', '2025-09-01', 'wiped', 'A', 500, 'Screen perfect'),
      ('SN54321', 'Samsung Galaxy S21', '2025-09-05', 'wiping', NULL, NULL, NULL),
      ('SN67890', 'Dell Laptop', '2025-09-03', 'wiped', 'B', 300, 'Battery replaced'),
      ('SN98765', 'iPad Air', '2025-09-02', 'resold', 'C', 150, 'Some scratches');
  `);

  console.log("✅ Database reset and seeded.");
  await db.close();
}

resetDb().catch((err) => {
  console.error("❌ Error resetting DB:", err);
  process.exit(1);
});
