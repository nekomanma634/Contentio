import { useState, useEffect } from 'react';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, CircularProgress, Chip, Alert, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

interface SystemLog {
  id: number;
  username: string;
  action: string;
  details: string;
  created_at: string;
}

const SystemLogs = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/admin/logs');
      if (!response.ok) throw new Error('ログの取得に失敗しました');
      const data = await response.json();
      setLogs(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionColor = (action: string) => {
    if (action === 'LOGIN') return 'success';
    if (action === 'SUBMIT') return 'primary';
    if (action === 'RATE_CALC') return 'warning';
    if (action.includes('CREATE')) return 'secondary';
    return 'default';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          🖥️ System Logs
        </Typography>
        <IconButton onClick={fetchLogs} color="primary" disabled={loading} title="Refresh Logs">
          <RefreshIcon />
        </IconButton>
      </Box>

      {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

      <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: 'background.paper' }}>
        {loading && logs.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <Table size="small">
            <TableHead sx={{ bgcolor: '#1e1e1e' }}>
              <TableRow>
                <TableCell width="10%">ID</TableCell>
                <TableCell width="20%">Timestamp</TableCell>
                <TableCell width="15%">User</TableCell>
                <TableCell width="15%" align="center">Action</TableCell>
                <TableCell width="40%">Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>ログがありません</TableCell></TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell color="text.secondary">#{log.id}</TableCell>
                    <TableCell>{new Date(log.created_at + 'Z').toLocaleString()}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{log.username}</TableCell>
                    <TableCell align="center">
                      <Chip label={log.action} color={getActionColor(log.action)} size="small" sx={{ fontWeight: 'bold' }} />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{log.details}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Container>
  );
};

export default SystemLogs;