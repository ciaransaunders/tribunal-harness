CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS embeddings (
    id SERIAL PRIMARY KEY,
    chunk_id VARCHAR(255) NOT NULL,
    tier VARCHAR(50),
    content TEXT NOT NULL,
    metadata JSONB,
    embedding vector
);
