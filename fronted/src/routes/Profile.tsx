import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Card, CardContent, Typography, Button, Box, Avatar, Alert, Divider, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import UploadFileIcon from '@mui/icons-material/UploadFile';

// 取得する対象ユーザーの型
interface ProfileUser {
  username: string;
  rating: number;
  avatar_url: string | null;
}

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const { user, updateAvatar } = useAuth();
  
  // 対象ユーザーのデータを保存するState
  const [profileData, setProfileData] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 見ているページが「ログイン中の自分」のものかどうか
  const isOwner = user?.name === username;

  // URLのユーザー名が変わるたびに、バックエンドからユーザー情報を取得する
  useEffect(() => {
    const fetchUser = async () => {
      if (!username) return;
      setLoading(true);
      setErrorMsg('');
      
      try {
        const response = await fetch(`http://localhost:3000/api/users/${username}`);
        if (!response.ok) {
          if (response.status === 404) throw new Error('ユーザーが見つかりません');
          throw new Error('データ取得エラー');
        }
        const data = await response.json();
        setProfileData(data);
      } catch (err: any) {
        setProfileData(null);
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [username, user?.avatarUrl]); // 自分のアバターを更新した時も再フェッチするように依存配列に追加

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('画像サイズは2MB以下にしてください。');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        await updateAvatar(base64String);
        setSuccessMsg('アイコンを更新しました！');
        setErrorMsg('');
      } catch (err) {
        setErrorMsg('更新に失敗しました。');
      }
    };
    reader.readAsDataURL(file);
  };

  // 読み込み中の表示
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  // ユーザーが存在しない場合の表示
  if (!profileData) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="error">{errorMsg || 'ユーザーが存在しません。'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Card elevation={2}>
        <CardContent sx={{ p: 4 }}>
          {/* プロフィールヘッダー部分 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, mb: 4 }}>
            <Avatar 
              // APIから取得した画像URLを使用。なければ頭文字。
              src={profileData.avatar_url || undefined} 
              sx={{ width: 100, height: 100, bgcolor: '#00C0C0', fontSize: '3rem' }}
            >
              {profileData.username.charAt(0).toUpperCase()}
            </Avatar>
            
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{profileData.username}</Typography>
              <Typography variant="h6" sx={{ color: '#00C0C0', fontWeight: 'bold' }}>
                Rating: {profileData.rating}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* 自分のページの場合のみ設定UIを表示 */}
          {isOwner && (
            <Box>
              <Typography variant="h6" gutterBottom>Profile Settings</Typography>
              
              {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
              {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

              <input 
                type="file" 
                accept="image/*" 
                hidden 
                ref={fileInputRef} 
                onChange={handleFileChange}
              />
              <Button 
                variant="outlined" 
                startIcon={<UploadFileIcon />}
                onClick={() => fileInputRef.current?.click()}
              >
                Change Avatar
              </Button>
            </Box>
          )}

          {!isOwner && (
            <Typography color="text.secondary">
              最近の活動はまだありません。
            </Typography>
          )}

        </CardContent>
      </Card>
    </Container>
  );
};

export default Profile;