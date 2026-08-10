-- Bookkeeping for incremental sync and nightly reconcile.
-- Run after 001_create_schema.sql.

ALTER TABLE context_chunks
  ADD COLUMN IF NOT EXISTS source_modified_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'context_chunks_source_key'
  ) THEN
    ALTER TABLE context_chunks
      ADD CONSTRAINT context_chunks_source_key
      UNIQUE (client_id, airtable_base, airtable_table, record_id, field_path);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS sync_state (
  source_key      text PRIMARY KEY,
  watermark       timestamptz,
  last_run_at     timestamptz,
  last_reconcile  timestamptz,
  last_error      text
);

CREATE TABLE IF NOT EXISTS sync_runs (
  id           bigserial PRIMARY KEY,
  source_key   text NOT NULL,
  started_at   timestamptz DEFAULT now(),
  finished_at  timestamptz,
  mode         text,
  fetched      int DEFAULT 0,
  embedded     int DEFAULT 0,
  upserted     int DEFAULT 0,
  deleted      int DEFAULT 0,
  error        text
);

CREATE INDEX IF NOT EXISTS sync_runs_source_started
  ON sync_runs (source_key, started_at DESC);
