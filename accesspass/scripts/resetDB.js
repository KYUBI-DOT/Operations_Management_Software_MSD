// scripts/resetDb.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";

async function reset() {
  const db = await open({
    filename: "./data/accesspass.db",
    driver: sqlite3.Database,
  });

  await db.exec(`
    PRAGMA foreign_keys = ON;

    DROP TABLE IF EXISTS requests;
    DROP TABLE IF EXISTS analytics;

     CREATE TABLE requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    system TEXT,  
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

    CREATE TABLE analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric     TEXT NOT NULL,
      value      INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (DATE('now'))
    );
  `);

  // seed requests
  await db.run(`INSERT INTO requests (user_name, access_area, status) VALUES ('Alice','Server Room','approved')`);
  await db.run(`INSERT INTO requests (user_name, access_area, status) VALUES ('Bob','Finance Office','pending')`);
  await db.run(`INSERT INTO requests (user_name, access_area, status) VALUES ('Charlie','Data Center','denied')`);

  // seed analytics
  await db.run(`INSERT INTO analytics (metric, value) VALUES ('total_requests',3)`);
  await db.run(`INSERT INTO analytics (metric, value) VALUES ('approved_requests',1)`);
  await db.run(`INSERT INTO analytics (metric, value) VALUES ('denied_requests',1)`);

  console.log("✅ Database reset and seeded.");
  await db.close();
}

reset().catch((e) => {
  console.error("❌ Reset failed:", e);
  process.exit(1);
});
