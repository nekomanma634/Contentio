-- Add migration script here
-- SQLiteではBOOLEANは内部的にINTEGER(0 or 1)として扱われます
ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT 0;