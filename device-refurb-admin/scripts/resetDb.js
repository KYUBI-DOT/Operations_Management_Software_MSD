import db from '../db.js';

db.exec(`DROP TABLE IF EXISTS devices;`);
db.exec(`
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

const seed = db.prepare(`
INSERT INTO devices (serial, model, intake_date, status, grade, price, notes)
VALUES (@serial, @model, @intake_date, @status, @grade, @price, @notes)
`);

[
  { serial:'SN-1001', model:'iPhone 12', intake_date:'2025-09-01', status:'intake', grade:null, price:null, notes:'Boots OK' },
  { serial:'SN-1002', model:'Galaxy S21', intake_date:'2025-09-02', status:'wiping', grade:null, price:null, notes:'Wipe in progress' },
  { serial:'SN-1003', model:'iPad Air 4', intake_date:'2025-09-03', status:'wiped', grade:'A', price:null, notes:'Battery 88%' },
  { serial:'SN-1004', model:'Pixel 6', intake_date:'2025-09-04', status:'wiped', grade:'B', price:null, notes:'Minor scratches' },
  { serial:'SN-1005', model:'MacBook Pro 2019', intake_date:'2025-09-05', status:'resold', grade:'C', price:650, notes:'Dented corner' }
].forEach(row => seed.run(row));

console.log('Database reset and seeded.');
