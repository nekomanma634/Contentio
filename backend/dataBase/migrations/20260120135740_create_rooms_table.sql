-- Add migration script here
CREATE TABLE rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    owner TEXT NOT NULL,
    now_player INTEGER NOT NULL DEFAULT 0,
    max_player INTEGER NOT NULL
);