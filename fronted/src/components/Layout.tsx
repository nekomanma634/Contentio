import { Outlet, Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, Box, Avatar } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  // Contextから実際のユーザー情報を取得
  const { user, logout } = useAuth(); 

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component={RouterLink} to="/" sx={{ flexGrow: 1, fontWeight: 'bold', textDecoration: 'none', color: 'inherit' }}>
            Contentio
          </Typography>
          
          <Button color="inherit" component={RouterLink} to="/">Home</Button>
          <Button color="inherit" component={RouterLink} to="/ranking">Ranking</Button>

          {user?.isAdmin && (
            <Button color="success" component={RouterLink} to="/admin/contests/create" sx={{ fontWeight: 'bold', ml: 1 }}>
              + Create Contest
            </Button>
          )}
          
          <Box sx={{ ml: 3 }}>
            {user ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                
                {/* ユーザー名とアイコンをプロフィールのリンクにする */}
                <Box 
                  component={RouterLink} 
                  to={`/users/${user.name}`} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    textDecoration: 'none', // リンクの下線を消す
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.8 } // ホバー時のエフェクト
                  }}
                >
                  <Typography variant="body1" sx={{ color: '#00C0C0', fontWeight: 'bold' }}>
                    {user.name}
                  </Typography>
                  <Avatar 
                    src={user.avatarUrl} 
                    sx={{ width: 32, height: 32, bgcolor: '#00C0C0' }}
                  >
                    {!user.avatarUrl && user.name.charAt(0).toUpperCase()}
                  </Avatar>
                </Box>
                
                {/* Settingsボタンは削除し、Logoutだけ残す */}
                <Button variant="text" size="small" onClick={logout} sx={{ color: 'text.secondary' }}>
                  Logout
                </Button>
              </Box>
            ) : (
                <>
                <Button variant="outlined" component={RouterLink} to="/login">
                    Sign In
                </Button>
                <Button variant="outlined" component={RouterLink} to="/register">
                    Sign Up
                </Button></>
            )}

          </Box>
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default Layout;