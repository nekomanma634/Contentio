import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, CircularProgress, Alert, Button, Chip } from '@mui/material';

interface Submission {
  id: number;
  created_at: string;
  task_label: string;
  task_title: string;
  username: string;
  language: string;
  status: string;
}

const Submissions = () => {
  const { contest_id } = useParams<{ contest_id: string }>();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/contests/${contest_id}/submissions`);
        if (!response.ok) throw new Error('提出履歴の取得に失敗しました');
        
        const data = await response.json();
        setSubmissions(data);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
    
    // 5秒ごとに自動更新（簡易的なリアルタイム更新）
    const intervalId = setInterval(fetchSubmissions, 5000);
    return () => clearInterval(intervalId);
  }, [contest_id]);

  // ジャッジ結果に応じた色を返す関数
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AC': return 'success';
      case 'WA': case 'RE': case 'TLE': case 'CE': return 'error';
      case 'WJ': return 'warning';
      default: return 'default';
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4, pb: 2, borderBottom: '2px solid #333' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
          {contest_id?.toUpperCase()} - All Submissions
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" component={RouterLink} to={`/contests/${contest_id}`} sx={{ fontWeight: 'bold' }}>Tasks</Button>
          <Button variant="contained" disabled sx={{ fontWeight: 'bold' }}>All Submissions</Button>
          <Button variant="outlined" component={RouterLink} to={`/contests/${contest_id}/standings`} sx={{ fontWeight: 'bold' }}>Standings</Button>
        </Box>
      </Box>

      {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

      <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: 'background.paper' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#1e1e1e' }}>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Task</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Language</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}><Typography color="text.secondary">まだ提出がありません。</Typography></TableCell>
              </TableRow>
            ) : (
              submissions.map((sub) => (
                <TableRow key={sub.id} hover>
                  {/* UTC時間をローカル時間に変換して表示 */}
                  <TableCell>{new Date(sub.created_at + 'Z').toLocaleString()}</TableCell>
                  <TableCell>
                    <Typography component="span" sx={{ color: '#90caf9', fontWeight: 'bold', mr: 1 }}>{sub.task_label}</Typography>
                    {sub.task_title}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{sub.username}</TableCell>
                  <TableCell>{sub.language === 'cpp' ? 'C++' : sub.language}</TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={sub.status} 
                      color={getStatusColor(sub.status)} 
                      size="small" 
                      sx={{ fontWeight: 'bold', minWidth: '60px' }} 
                    />
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

export default Submissions;