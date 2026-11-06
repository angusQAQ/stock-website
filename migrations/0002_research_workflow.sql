CREATE TABLE research_settings (
  id INTEGER PRIMARY KEY CHECK(id=1),
  profiles TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK(revision > 0),
  updated_at TEXT NOT NULL
);
ALTER TABLE analysis_jobs ADD COLUMN cancelled_at TEXT;
