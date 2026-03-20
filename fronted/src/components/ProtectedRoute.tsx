import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = () => {
  const { user } = useAuth();

  // ユーザーがログインしていない場合はログイン画面へリダイレクト
  // replaceをつけることで、ブラウザの「戻る」ボタンで保護されたページに戻るのを防ぎます
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ログインしている場合は、子ルート（Outlet）をレンダリング
  return <Outlet />;
};

export default ProtectedRoute;