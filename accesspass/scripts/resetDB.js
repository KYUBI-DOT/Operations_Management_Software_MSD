import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = await open({
  filename: path.join(__dirname, "../data/accesspass.db"),
  driver: sqlite3.Database
});

await db.exec(`DROP TABLE IF EXISTS requests;`);
await db.exec(`
CREATE TABLE requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_name TEXT NOT NULL,
  email TEXT NOT NULL,
  system TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending','approved','denied','revoked')) DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (DATE('now')),
  decided_at TEXT,
  decision_notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_system ON requests(system);
`);

const seed = db.prepare(`
  INSERT INTO requests (employee_name,email,system,reason,status,created_at,decided_at,decision_notes)
  VALUES (?,?,?,?,?,?,?,?)
`);

const rows = [
  ["Priya Kumar","priya@corp.com","GitHub","New project repo", "pending","2025-09-10", null, null],
  ["Alex Tan","alex@corp.com","Jira","Backlog access", "approved","2025-09-08","2025-09-09","Approved for project A"],
  ["Sara Lee","sara@corp.com","VPN","Remote work", "denied","2025-09-05","2025-09-06","Need manager approval"],
  ["John Kim","john@corp.com","GitHub","PR reviews", "approved","2025-09-01","2025-09-02","OK"],
  ["Maya Roy","maya@corp.com","Jira","Read-only board", "revoked","2025-08-20","2025-09-01","Contract ended"]
];

for (const r of rows) await seed.run(r);
console.log("✅ DB reset & seeded.");
await db.close();
