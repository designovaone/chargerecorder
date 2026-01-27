-- Neon PostgreSQL Schema for Charge Recorder
-- Run this in your Neon database console

CREATE TABLE IF NOT EXISTS charging_sessions (
    id SERIAL PRIMARY KEY,
    start_percentage INTEGER NOT NULL CHECK (start_percentage >= 0 AND start_percentage <= 100),
    start_time TIMESTAMP NOT NULL DEFAULT NOW(),
    end_percentage INTEGER CHECK (end_percentage >= 0 AND end_percentage <= 100),
    end_time TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_start_time ON charging_sessions(start_time DESC);
