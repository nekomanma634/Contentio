CREATE TABLE IF NOT EXISTS system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    action TEXT NOT NULL,   -- 'LOGIN', 'SUBMIT', 'CREATE_CONTEST' など
    details TEXT NOT NULL,  -- 補足情報（「Task ID: 1 に C++ で提出」など）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);