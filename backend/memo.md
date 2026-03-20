# 1. データベースを削除
sqlx database drop -y

# 2. データベースを空っぽの状態で再作成
sqlx database create

# 3. 今まで作った全マイグレーション（テーブル作成、カラム追加）を一気に適用
sqlx migrate run