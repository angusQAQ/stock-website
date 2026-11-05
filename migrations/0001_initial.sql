CREATE TABLE IF NOT EXISTS ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK(kind IN ('deposit', 'withdrawal', 'opening', 'buy', 'sell')),
  symbol TEXT,
  quantity_units INTEGER NOT NULL DEFAULT 0,
  price_units INTEGER NOT NULL DEFAULT 0,
  fee_cents INTEGER NOT NULL DEFAULT 0 CHECK(fee_cents >= 0),
  cash_delta_cents INTEGER NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ledger_symbol ON ledger(symbol, id);
CREATE TABLE IF NOT EXISTS watchlist (symbol TEXT PRIMARY KEY, added_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS analysis_jobs (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  horizon TEXT NOT NULL,
  risk TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','completed','failed')),
  snapshot TEXT NOT NULL,
  result TEXT,
  error TEXT,
  claim_token TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS jobs_pending ON analysis_jobs(status, created_at);
CREATE TABLE IF NOT EXISTS bridge_state (id INTEGER PRIMARY KEY CHECK(id=1), last_seen TEXT NOT NULL);
