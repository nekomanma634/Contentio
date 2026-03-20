import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, CircularProgress, Alert, Avatar } from '@mui/material';

interface UserRanking {
  username: string;
  rating: number;
  avatar_url?: string;
}

const Ranking = () => {
  const [ranking, setRanking] = useState<UserRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/ranking');
        if (!response.ok) throw new Error('ランキングの取得に失敗しました');
        
        const data = await response.json();
        setRanking(data);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, []);

  // レーティングに応じた色を返す関数（AtCoder風）
  const getRatingColor = (rating: number) => {
    if (rating >= 2800) return '#ff0000'; // 赤
    if (rating >= 2400) return '#ff8c00'; // 橙
    if (rating >= 2000) return '#ffff00'; // 黄
    if (rating >= 1600) return '#0000ff'; // 青
    if (rating >= 1200) return '#00c0c0'; // 水
    if (rating >= 800) return '#008000';  // 緑
    if (rating >= 400) return '#8b4513';  // 茶
    return '#808080';                     // 灰
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
        🏆 Global Ranking
      </Typography>

      {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

      <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: 'background.paper' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#1e1e1e' }}>
            <TableRow>
              <TableCell align="center" width="15%">Rank</TableCell>
              <TableCell width="60%">User</TableCell>
              <TableCell align="center" width="25%">Rating</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ranking.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">ユーザーが存在しません。</Typography>
                </TableCell>
              </TableRow>
            ) : (
              ranking.map((user, index) => (
                <TableRow key={user.username} hover>
                  <TableCell align="center" sx={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'text.secondary' }}>
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={user.avatar_url} alt={user.username} sx={{ width: 32, height: 32 }} />
                      <Typography 
                        component={RouterLink} 
                        to={`/users/${user.username}`}
                        sx={{ 
                          fontWeight: 'bold', 
                          color: getRatingColor(user.rating),
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {user.username}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: getRatingColor(user.rating) }}>
                    {user.rating}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Ranking;