import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, CardContent, Typography, TextField, Button, Box, Alert } from '@mui/material';

const CreateContest = () => {
  const [contestId, setContestId] = useState('');
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('100');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('http://localhost:3000/api/admin/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: contestId,
          title,
          start_time: startTime,
          duration_minutes: parseInt(duration, 10),
        }),
      });

      if (!response.ok) {
        if (response.status === 409) throw new Error('そのコンテストIDは既に使われています');
        throw new Error('コンテストの作成に失敗しました');
      }

      setSuccessMsg('コンテストを作成しました！ 問題作成ページへ移動します...');
      
      // 成功後、このコンテスト専用の問題作成ページへ遷移
      setTimeout(() => {
        navigate(`/admin/contests/${contestId}/tasks/create`);
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 3 }}>
            🏆 Create New Contest
          </Typography>

          {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}
          {successMsg && <Alert severity="success" sx={{ mb: 3 }}>{successMsg}</Alert>}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Contest ID (URL)"
              placeholder="例: abc443"
              required
              value={contestId}
              onChange={(e) => setContestId(e.target.value)}
              helperText="URLの一部になります（半角英数字）"
            />
            <TextField
              label="Contest Title"
              placeholder="例: LocalCoder Beginner Contest 443"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              label="Start Time"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <TextField
              label="Duration (minutes)"
              type="number"
              required
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
            <Button type="submit" variant="contained" color="primary" size="large" sx={{ fontWeight: 'bold' }}>
              Create Contest
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CreateContest;