import { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

// バックエンドから受け取るコンテストの型
interface Contest {
  id: string;
  title: string;
  start_time: string;
  duration_minutes: number;
}

// バックエンドから受け取るランキングの型
interface UserRanking {
  username: string;
  rating: number;
  avatar_url?: string;
}

const Home = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ランキング用のステートを追加
  const [ranking, setRanking] = useState<UserRanking[]>([]);

  // コンテスト一覧とランキングをバックエンドから取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contestsRes, rankingRes] = await Promise.all([
          fetch('http://localhost:3000/api/contests'),
          fetch('http://localhost:3000/api/ranking') // 👈 実際のAPIから取得
        ]);

        if (contestsRes.ok) {
          const data = await contestsRes.json();
          setContests(data);
        }
        if (rankingRes.ok) {
          const data = await rankingRes.json();
          setRanking(data.slice(0, 10)); // トップページのサイドバーなので上位10人に絞る
        }
      } catch (error) {
        console.error('データの取得に失敗しました', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 時間を計算してステータス（Upcoming, Active, Past）を判定する関数
  const getContestStatus = (startTimeStr: string, durationMinutes: number) => {
    const now = new Date();
    const startTime = new Date(startTimeStr.replace(' ', 'T')); // "2026-03-21 21:00:00" -> "2026-03-21T21:00:00"
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    if (now < startTime) return { label: 'Upcoming', color: 'primary' as const };
    if (now >= startTime && now <= endTime) return { label: 'Active', color: 'error' as const };
    return { label: 'Past', color: 'default' as const };
  };

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

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={8}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          Contests
        </Typography>
        
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell>Start Time</TableCell>
                  <TableCell>Contest Name</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contests.map((contest) => {
                  const status = getContestStatus(contest.start_time, contest.duration_minutes);
                  return (
                    <TableRow key={contest.id} hover>
                      <TableCell>{contest.start_time.substring(0, 16)}</TableCell>
                      <TableCell>
                        <Button component={RouterLink} to={`/contests/${contest.id}`} sx={{ textTransform: 'none', fontWeight: 'bold' }}>
                          {contest.title}
                        </Button>
                      </TableCell>
                      <TableCell>{contest.duration_minutes} min</TableCell>
                      <TableCell>
                        <Chip label={status.label} color={status.color} size="small" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Grid>

      {/* ---------------- 右カラム：ランキング ---------------- */}
      <Grid item xs={12} md={4}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          Rating Ranking (Top 10)
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell align="center">Rank</TableCell>
                <TableCell>User</TableCell>
                <TableCell align="right">Rating</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ranking.map((row, index) => (
                <TableRow key={row.username} hover>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <RouterLink 
                      to={`/users/${row.username}`} 
                      style={{ 
                        color: getRatingColor(row.rating), 
                        fontWeight: 'bold', 
                        textDecoration: 'none' 
                      }}
                    >
                      {row.username}
                    </RouterLink>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: getRatingColor(row.rating) }}>
                    {row.rating}
                  </TableCell>
                </TableRow>
              ))}
              {ranking.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 2 }}>
                    <Typography color="text.secondary" variant="body2">No users found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
};

export default Home;