import db from '../db.js';

await db.exec(`DROP TABLE IF EXISTS devices;`);
await db.exec(`
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
CREATE INDEX IF NOT EXISTS idx_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_model ON devices(model);
`);

const insert = await db.prepare(`
INSERT INTO devices (serial, model, intake_date, status, grade, price, notes)
VALUES (?, ?, ?, ?, ?, ?, ?)
`);

await insert.run('SN-1001', 'iPhone 12', '2025-09-01', 'intake', null, null, 'Boots OK');
await insert.run('SN-1002', 'Galaxy S21', '2025-09-02', 'wiping', null, null, 'Wipe in progress');
await insert.run('SN-1003', 'iPad Air 4', '2025-09-03', 'wiped', 'A', null, 'Battery 88%');
await insert.run('SN-1004', 'Pixel 6', '2025-09-04', 'wiped', 'B', null, 'Minor scratches');
await insert.run('SN-1005', 'MacBook Pro 2019', '2025-09-05', 'resold', 'C', 650, 'Dented corner');

console.log('✅ Database reset and seeded.');
