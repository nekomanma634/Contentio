import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, CircularProgress, Alert, Button } from '@mui/material';

interface Task {
  id: number;
  label: string;
}

interface TaskResult {
  is_ac: boolean;
  penalty: number;
}

interface UserStandings {
  rank: number;
  username: string;
  total_ac: number;
  total_penalty: number;
  task_results: { [key: string]: TaskResult };
}

interface StandingsResponse {
  tasks: Task[];
  rows: UserStandings[];
}

const Standings = () => {
  const { contest_id } = useParams<{ contest_id: string }>();
  const [data, setData] = useState<StandingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchStandings = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/contests/${contest_id}/standings`);
      if (!response.ok) throw new Error('順位表の取得に失敗しました');
      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandings();
    // 10秒ごとに自動更新
    const intervalId = setInterval(fetchStandings, 10000);
    return () => clearInterval(intervalId);
  }, [contest_id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4, pb: 2, borderBottom: '2px solid #333' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
          {contest_id?.toUpperCase()} - Standings
        </Typography>
        
        {/* 画面切り替え用のタブボタン */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" component={RouterLink} to={`/contests/${contest_id}`} sx={{ fontWeight: 'bold' }}>Tasks</Button>
          <Button variant="outlined" component={RouterLink} to={`/contests/${contest_id}/submissions`} sx={{ fontWeight: 'bold' }}>All Submissions</Button>
          <Button variant="contained" disabled sx={{ fontWeight: 'bold' }}>Standings</Button>
        </Box>
      </Box>

      {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

      <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: 'background.paper' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#1e1e1e' }}>
            <TableRow>
              <TableCell align="center" width="8%">Rank</TableCell>
              <TableCell width="20%">User</TableCell>
              <TableCell align="center" width="10%" sx={{ fontWeight: 'bold', color: '#90caf9' }}>Score</TableCell>
              
              {/* 各問題のヘッダー列を動的に生成 */}
              {data?.tasks.map((t) => (
                <TableCell key={t.id} align="center" sx={{ fontWeight: 'bold' }}>
                  {t.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.rows.length === 0 ? (
              <TableRow><TableCell colSpan={3 + (data?.tasks.length || 0)} align="center" sx={{ py: 4 }}>まだ参加者がいません。</TableCell></TableRow>
            ) : (
              data?.rows.map((row) => (
                <TableRow key={row.username} hover>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>{row.rank}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{row.username}</TableCell>
                  <TableCell align="center">
                    <Typography sx={{ fontWeight: 'bold', color: '#90caf9' }}>{row.total_ac}</Typography>
                    {row.total_penalty > 0 && <Typography variant="caption" color="error">({row.total_penalty})</Typography>}
                  </TableCell>
                  
                  {/* 各問題の結果を動的に描画 */}
                  {data.tasks.map((t) => {
                    const result = row.task_results[t.id.toString()];
                    if (!result) return <TableCell key={t.id} align="center">-</TableCell>; // まだ提出していない

                    return (
                      <TableCell key={t.id} align="center">
                        {result.is_ac ? (
                          <Box sx={{ display: 'inline-block', px: 1.5, py: 0.5, bgcolor: '#1b5e20', borderRadius: 1, color: 'white' }}>
                            <Typography sx={{ fontWeight: 'bold', fontSize: '14px' }}>AC</Typography>
                            {result.penalty > 0 && <Typography variant="caption">{result.penalty}</Typography>}
                          </Box>
                        ) : (
                          <Box sx={{ display: 'inline-block', px: 1.5, py: 0.5 }}>
                            <Typography sx={{ fontWeight: 'bold', color: '#f44336' }}>
                              WA x {result.penalty}
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Standings;