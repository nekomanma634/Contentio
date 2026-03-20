CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    time_limit REAL NOT NULL, -- 実行制限時間 (秒) 例: 2.0
    memory_limit INTEGER NOT NULL, -- メモリ制限 (MB) 例: 1024
    markdown_content TEXT NOT NULL, -- 問題文のMarkdown
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);