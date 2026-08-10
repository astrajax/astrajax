-- Context index: disposable search layer over Airtable.
-- Airtable remains the system of record. Rebuild this anytime.
-- Run in the Neon SQL editor against the same database as DATABASE_URL.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS context_chunks (
  id                 bigserial PRIMARY KEY,
  client_id          text NOT NULL,
  airtable_base      text NOT NULL,
  airtable_table     text NOT NULL,
  record_id          text NOT NULL,
  field_path         text NOT NULL,
  content            text NOT NULL,
  embedding          vector(1536),
  approved_at        timestamptz,
  source_modified_at timestamptz,
  synced_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS context_chunks_client_id_idx
  ON context_chunks (client_id);

CREATE INDEX IF NOT EXISTS context_chunks_embedding_hnsw_idx
  ON context_chunks USING hnsw (embedding vector_cosine_ops);
