// Favourites backend — Express + SQLite (Node's built-in node:sqlite).
//
// This is the store for saved favourites. The React app talks to it at
// /api/favourites (proxied by CRA in development, see the "proxy" field
// in the app package.json).
//
// Favourites table:
//   favourites(advice_id INTEGER PRIMARY KEY, advice_en TEXT NOT NULL,
//              advice_sw TEXT, created_at TEXT)
//
// There is deliberately NO Kalenjin column: Kalenjin wording only enters
// saved data after Lesley reviews and approves it, and no Kalenjin text
// has been approved yet.
//
// Run:  npm install   (inside server/)
//       node index.js (listens on http://localhost:5001)
// The database file favourites.db is created next to this file and is
// gitignored — it is Lesley's data, not source code.
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const express = require("express");

const PORT = process.env.PORT ? Number(process.env.PORT) : 5001;
const DB_PATH = path.join(__dirname, "favourites.db");

const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS favourites (
    advice_id INTEGER PRIMARY KEY,
    advice_en TEXT NOT NULL,
    advice_sw TEXT,
    created_at TEXT NOT NULL
  )
`);

const app = express();
app.use(express.json());

function rowToFavourite(row) {
  return {
    adviceId: row.advice_id,
    adviceEn: row.advice_en,
    adviceSw: row.advice_sw,
    createdAt: row.created_at,
  };
}

// GET /api/favourites — newest first.
app.get("/api/favourites", (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM favourites ORDER BY created_at DESC")
    .all();
  res.json(rows.map(rowToFavourite));
});

// POST /api/favourites { adviceId, adviceEn, adviceSw? }
// Saving the same advice twice updates it instead of duplicating it.
app.post("/api/favourites", (req, res) => {
  const { adviceId, adviceEn, adviceSw } = req.body ?? {};
  if (!Number.isInteger(adviceId) || typeof adviceEn !== "string" || !adviceEn.trim()) {
    return res.status(400).json({
      error: "adviceId (integer) and adviceEn (non-empty string) are required.",
    });
  }
  const createdAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO favourites (advice_id, advice_en, advice_sw, created_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(advice_id) DO UPDATE SET
       advice_en = excluded.advice_en,
       advice_sw = excluded.advice_sw,
       created_at = excluded.created_at`,
  ).run(adviceId, adviceEn.trim(), adviceSw ?? null, createdAt);
  const row = db
    .prepare("SELECT * FROM favourites WHERE advice_id = ?")
    .get(adviceId);
  res.status(201).json(rowToFavourite(row));
});

// DELETE /api/favourites/:adviceId — remove one favourite.
app.delete("/api/favourites/:adviceId", (req, res) => {
  const adviceId = Number(req.params.adviceId);
  if (!Number.isInteger(adviceId)) {
    return res.status(400).json({ error: "adviceId must be an integer." });
  }
  const result = db
    .prepare("DELETE FROM favourites WHERE advice_id = ?")
    .run(adviceId);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Favourite not found." });
  }
  res.status(204).end();
});

// DELETE /api/favourites — clear all favourites.
app.delete("/api/favourites", (_req, res) => {
  db.prepare("DELETE FROM favourites").run();
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Favourites server listening on http://localhost:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
});
