## memo
```bash
# 1. データベースファイル (data.db) を作成
sqlx database create

# 2. マイグレーションファイル（テーブル定義書）を作成
# "create_rooms_table" という名前は何でもOKです
sqlx migrate add create_rooms_table

# 3. SQLを実行してテーブルを作る
sqlx migrate run
```

<!-- -- Add migration script here
CREATE TABLE rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    owner TEXT NOT NULL,
    now_player INTEGER NOT NULL DEFAULT 0,
    max_player INTEGER NOT NULL
); -->