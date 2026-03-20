CREATE TABLE IF NOT EXISTS contest_tasks (
    contest_id TEXT NOT NULL,
    task_id INTEGER NOT NULL,
    task_label TEXT NOT NULL, -- 'A', 'B', 'C' などの問題番号
    PRIMARY KEY (contest_id, task_id)
);