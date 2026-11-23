# Favourites backend

A small Express server with a SQLite database. This is where saved
favourites live — so they survive closing the browser and work on another
device, instead of lasting only for the session.

## Run it

```bash
cd server
npm install
node index.js
```

It listens on **http://localhost:5001** and creates `favourites.db` next to
`index.js` on first run. That file is gitignored — it's Lesley's data,
not source code.

The React app talks to it at `/api/favourites`. In development, Create
React App proxies those requests to this server (see the `"proxy"` field
in the app's `package.json`).

## API

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/api/favourites` | List favourites, newest first |
| `POST` | `/api/favourites` | Save one: `{ "adviceId": 117, "adviceEn": "...", "adviceSw": "..." }` (`adviceSw` optional). Saving the same advice twice updates it, it doesn't duplicate it. |
| `DELETE` | `/api/favourites/:adviceId` | Remove one favourite (404 if it isn't saved) |
| `DELETE` | `/api/favourites` | Clear all favourites |

## Data

Table `favourites`:

```
advice_id  INTEGER PRIMARY KEY   — Advice Slip ID
advice_en  TEXT NOT NULL         — English advice (the source language)
advice_sw  TEXT                  — Kiswahili translation, when known
created_at TEXT NOT NULL         — ISO timestamp of when it was saved
```

There is deliberately **no Kalenjin column**: Kalenjin wording only
enters saved data after Lesley reviews and approves it, and no Kalenjin
text has been approved yet.

## Quick check

With the server running:

```bash
curl -X POST http://localhost:5001/api/favourites \
  -H 'Content-Type: application/json' \
  -d '{"adviceId":117,"adviceEn":"It is easy to sit up and take notice, what is difficult is getting up and taking action."}'
curl http://localhost:5001/api/favourites
curl -X DELETE http://localhost:5001/api/favourites/117
```
