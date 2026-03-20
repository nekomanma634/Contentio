import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Container, Typography, Paper, Box, CircularProgress, Alert, Button, IconButton, Divider, Grid } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface TestCase {
  id: number;
  input_data: string;
  expected_output: string;
}

const ManageTestCases = () => {
  const { contest_id, task_id } = useParams<{ contest_id: string; task_id: string }>();
  const [testcases, setTestcases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // 新規追加用ステート
  const [inputData, setInputData] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');

  const fetchTestcases = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/admin/tasks/${task_id}/testcases`);
      if (!response.ok) throw new Error('テストケースの取得に失敗しました');
      const data = await response.json();
      setTestcases(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestcases();
  }, [task_id]);

  const handleAddTestcase = async () => {
    if (!expectedOutput.trim()) {
      alert('期待される出力(Expected Output)は必須です');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3000/api/admin/tasks/${task_id}/testcases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_data: inputData, expected_output: expectedOutput }),
      });

      if (!response.ok) throw new Error('追加に失敗しました');

      // 成功したら一覧を再取得し、フォームを空にする
      setInputData('');
      setExpectedOutput('');
      fetchTestcases();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteTestcase = async (id: number) => {
    if (!window.confirm('本当にこのテストケースを削除しますか？')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/admin/testcases/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('削除に失敗しました');
      
      // 成功したら一覧から消す
      setTestcases(testcases.filter(tc => tc.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  // テキストエリアの共通スタイル
  const textAreaStyle = {
    width: '100%', height: '150px', padding: '12px',
    fontFamily: "'Fira Code', 'Consolas', monospace", fontSize: '14px',
    backgroundColor: '#1a1a1a', color: '#e0e0e0',
    border: '1px solid #333', borderRadius: '4px', resize: 'none' as 'none',
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <IconButton component={RouterLink} to={`/contests/${contest_id}`} sx={{ mr: 2, color: 'white' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          🧪 Manage Test Cases (Task ID: {task_id})
        </Typography>
      </Box>

      {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

      <Grid container spacing={4}>
        {/* 左側: 既存のテストケース一覧 */}
        <Grid item xs={12} md={7}>
          <Typography variant="h6" gutterBottom>Saved Test Cases ({testcases.length})</Typography>
          {testcases.length === 0 ? (
            <Typography color="text.secondary">テストケースがありません。</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {testcases.map((tc, index) => (
                <Paper key={tc.id} variant="outlined" sx={{ p: 2, bgcolor: '#1e1e1e', position: 'relative' }}>
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>Case #{index + 1} (ID: {tc.id})</Typography>
                  <IconButton 
                    color="error" 
                    onClick={() => handleDeleteTestcase(tc.id)} 
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Input Data:</Typography>
                      <Box component="pre" sx={{ m: 0, p: 1, bgcolor: '#000', borderRadius: 1, overflowX: 'auto', fontSize: '12px' }}>
                        {tc.input_data || '(Empty)'}
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Expected Output:</Typography>
                      <Box component="pre" sx={{ m: 0, p: 1, bgcolor: '#000', borderRadius: 1, overflowX: 'auto', fontSize: '12px' }}>
                        {tc.expected_output}
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Box>
          )}
        </Grid>

        {/* 右側: 新規追加フォーム */}
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 3, bgcolor: '#1e1e1e', position: 'sticky', top: '24px' }}>
            <Typography variant="h6" gutterBottom>Add New Test Case</Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Input Data (Standard Input)</Typography>
            <textarea
              style={textAreaStyle}
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder="例: 3 5"
            />

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Expected Output (Standard Output)</Typography>
            <textarea
              style={textAreaStyle}
              value={expectedOutput}
              onChange={(e) => setExpectedOutput(e.target.value)}
              placeholder="例: 8"
            />

            <Button 
              variant="contained" 
              color="success" 
              fullWidth 
              size="large" 
              sx={{ mt: 3, fontWeight: 'bold' }}
              onClick={handleAddTestcase}
            >
              + Add Test Case
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ManageTestCases;