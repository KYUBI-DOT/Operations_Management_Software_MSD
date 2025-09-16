// scripts/resetDb.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const init = async () => {
  const db = await open({
    filename: "./data/accesspass.db",
    driver: sqlite3.Database,
  });

  // Drop and recreate tables
  await db.exec(`
    DROP TABLE IF EXISTS requests;
    DROP TABLE IF EXISTS analytics;

    CREATE TABLE requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_name TEXT NOT NULL,
      access_area TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending','approved','denied')) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric TEXT NOT NULL,
      value INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed requests
  const insertRequest = await db.prepare(`
    INSERT INTO requests (user_name, access_area, status)
    VALUES (?, ?, ?)
  `);

  await insertRequest.run("Alice", "Server Room", "approved");
  await insertRequest.run("Bob", "Finance Office", "pending");
  await insertRequest.run("Charlie", "Data Center", "denied");

  // Seed analytics
  const insertMetric = await db.prepare(`
    INSERT INTO analytics (metric, value)
    VALUES (?, ?)
  `);

  await insertMetric.run("total_requests", 3);
  await insertMetric.run("approved_requests", 1);
  await insertMetric.run("denied_requests", 1);

  console.log("✅ Database reset and seeded.");
  await db.close();
};

init();
