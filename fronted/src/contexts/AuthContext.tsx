import React, { createContext, useState, useContext, type ReactNode } from 'react';

// ユーザー情報の型定義（アイコン画像URLを追加）
interface User {
  id: string;
  name: string;
  rating: number;
  avatarUrl?: string;
  isAdmin: boolean;
}

// const mappedUser: User = { 
//   id: userData.id.toString(), 
//   name: userData.username, 
//   rating: userData.rating,
//   avatarUrl: userData.avatar_url,
//   isAdmin: userData.is_admin // バックエンドから受け取る
// };

// Contextで提供する機能の型定義（パスワード引数とアバター更新を追加）
interface AuthContextType {
  user: User | null;
  login: (username: string, password?: string) => Promise<void>;
  register: (username: string, password?: string) => Promise<void>;
  updateAvatar: (base64Image: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 初期化時に localStorage からユーザー情報を復元する
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('localcoder_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // --------------------------------------------------------
  // ログイン処理
  // --------------------------------------------------------
  const login = async (username: string, password?: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('ユーザー名またはパスワードが間違っています');
        }
        throw new Error('サーバー通信エラーが発生しました');
      }

      const userData = await response.json();
      
      const loggedInUser: User = { 
        id: userData.id.toString(), 
        name: userData.username, 
        rating: userData.rating,
        avatarUrl: userData.avatar_url,
        isAdmin: Boolean(userData.is_admin) // バックエンドから受け取った値をセット
      };
      
      setUser(loggedInUser);
      localStorage.setItem('localcoder_user', JSON.stringify(loggedInUser));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // --------------------------------------------------------
  // ユーザー登録処理
  // --------------------------------------------------------
  const register = async (username: string, password?: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('そのユーザー名は既に使われています');
        }
        if (response.status === 400) {
          throw new Error('入力内容に不備があります');
        }
        throw new Error('登録に失敗しました');
      }

      const userData = await response.json();
      
      const newUser: User = { 
        id: userData.id.toString(), 
        name: userData.username, 
        rating: userData.rating,
        avatarUrl: userData.avatar_url,
        isAdmin: Boolean(userData.is_admin) // バックエンドから受け取った値をセット
      };
      
      setUser(newUser);
      localStorage.setItem('localcoder_user', JSON.stringify(newUser));
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  // --------------------------------------------------------
  // アバター（アイコン）画像の更新処理
  // --------------------------------------------------------
  const updateAvatar = async (base64Image: string) => {
    if (!user) return;

    try {
      const response = await fetch('http://localhost:3000/api/user/avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.name, avatar_base64: base64Image }),
      });

      if (!response.ok) {
        throw new Error('画像の更新に失敗しました');
      }
      
      // 成功したらReactのStateとlocalStorageの両方を更新
      const updatedUser: User = { ...user, avatarUrl: base64Image };
      setUser(updatedUser);
      localStorage.setItem('localcoder_user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Update avatar error:', error);
      throw error;
    }
  };

  // --------------------------------------------------------
  // ログアウト処理
  // --------------------------------------------------------
  const logout = () => {
    setUser(null);
    localStorage.removeItem('localcoder_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, updateAvatar, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// カスタムフック：コンポーネントから簡単にContextを呼び出すため
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};