-- パスワードハッシュとアイコンURL（Base64文字列）を保存するカラムを追加
ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN avatar_url TEXT;