import { useState, useRef } from 'react';
import { Container, Card, CardContent, Typography, Button, Box, Avatar, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const Settings = () => {
  const { user, updateAvatar } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return <Typography>ログインが必要です</Typography>;

  // ファイルが選択された時の処理（画像をBase64に変換）
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルサイズ制限 (例: 2MB以下)
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
    reader.readAsDataURL(file); // 画像をDataURL(Base64)として読み込む
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Settings
      </Typography>

      <Card elevation={2}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>Profile</Typography>
          
          {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
          {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, mt: 2 }}>
            <Avatar 
              src={user.avatarUrl} 
              sx={{ width: 100, height: 100, bgcolor: '#00C0C0', fontSize: '2rem' }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            
            <Box>
              <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>{user.name}</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>Rating: {user.rating}</Typography>
              
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
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Settings;