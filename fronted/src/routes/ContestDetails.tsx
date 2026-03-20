import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, CircularProgress, Alert, Button, IconButton, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ScienceIcon from '@mui/icons-material/Science';
import SaveIcon from '@mui/icons-material/Save';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useAuth } from '../contexts/AuthContext';

interface TaskSummary {
  id: number;
  label: string;
  title: string;
  time_limit: number;
  memory_limit: number;
}

interface ContestInfo {
  id: string;
  title: string;
  start_time: string;
  duration_minutes: number;
  is_rated: boolean;
  description: string;
}

const ContestDetails = () => {
  const { contest_id } = useParams<{ contest_id: string }>();
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [contest, setContest] = useState<ContestInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [now, setNow] = useState(new Date());
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contestRes, tasksRes] = await Promise.all([
          fetch(`http://localhost:3000/api/contests/${contest_id}`),
          fetch(`http://localhost:3000/api/contests/${contest_id}/tasks`)
        ]);

        if (!contestRes.ok || !tasksRes.ok) throw new Error('データの取得に失敗しました');
        
        const contestData = await contestRes.json();
        const tasksData = await tasksRes.json();
        
        contestData.start_time = new Date(contestData.start_time.replace(' ', 'T')); 
        
        setContest(contestData);
        setTasks(tasksData);
        setEditDesc(contestData.description || ''); // 👈 取得した説明文をセット
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const timerId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timerId);
  }, [contest_id]);

  const handleCalculateRatings = async () => {
    if (!window.confirm('このコンテストのレーティング計算を実行しますか？（この操作は一度しか行えません）')) return;
    try {
      const response = await fetch(`http://localhost:3000/api/admin/contests/${contest_id}/rate`, { method: 'POST' });
      if (!response.ok) throw new Error('レーティングの計算に失敗しました');
      alert('レーティングの計算と反映が完了しました！');
      window.location.reload(); 
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 👇 説明文の保存処理を追加
  const handleSaveDescription = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/admin/contests/${contest_id}/description`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: editDesc }),
      });
      if (!response.ok) throw new Error('更新に失敗しました');
      
      setContest({ ...contest!, description: editDesc });
      setIsEditingDesc(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading || !contest) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  const startTime = contest.start_time as unknown as Date;
  const endTime = new Date(startTime.getTime() + contest.duration_minutes * 60000);
  const isBeforeStart = now < startTime;
  const isRunning = now >= startTime && now <= endTime;
  const isEnded = now > endTime;

  const formatTimeDiff = (target: Date) => {
    const diff = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4, pb: 2, borderBottom: '2px solid #333' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>{contest.title}</Typography>
            <Typography color="text.secondary">Start: {startTime.toLocaleString()} / Duration: {contest.duration_minutes} minutes</Typography>
          </Box>
          {user?.isAdmin && (
            <Button variant="contained" color="success" component={RouterLink} to={`/admin/contests/${contest_id}/tasks/create`} sx={{ fontWeight: 'bold' }}>
              + Add Task
            </Button>
          )}
        </Box>

        {/* タイマー表示エリア */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3, p: 2, bgcolor: '#1e1e1e', borderRadius: 2 }}>
          {isBeforeStart && (
            <><Chip label="Upcoming" color="primary" sx={{ fontWeight: 'bold' }} /><Typography variant="h6" sx={{ fontFamily: 'monospace' }}>Starts in: {formatTimeDiff(startTime)}</Typography></>
          )}
          {isRunning && (
            <><Chip label="Running" color="error" sx={{ fontWeight: 'bold' }} /><Typography variant="h6" sx={{ fontFamily: 'monospace' }}>Time Left: {formatTimeDiff(endTime)}</Typography></>
          )}
          {isEnded && (
            <>
              <Chip label="Ended" color="default" sx={{ fontWeight: 'bold' }} />
              {contest.is_rated && <Chip label="Rated" color="success" sx={{ fontWeight: 'bold' }} />}
              {!contest.is_rated && user?.isAdmin && (
                <Button variant="contained" color="warning" onClick={handleCalculateRatings} sx={{ fontWeight: 'bold', ml: 'auto' }}>
                  ★ Calculate Ratings
                </Button>
              )}
            </>
          )}
        </Box>
      </Box>

      {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

      {/* コンテスト説明文エリアを追加 */}
      <Paper variant="outlined" sx={{ p: 4, mb: 4, bgcolor: '#1e1e1e', borderRadius: '8px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Description</Typography>
          {user?.isAdmin && !isEditingDesc && (
            <Button startIcon={<EditIcon />} size="small" variant="outlined" onClick={() => setIsEditingDesc(true)}>
              Edit
            </Button>
          )}
        </Box>

        {isEditingDesc ? (
          <Box>
            <textarea
              style={{
                width: '100%', height: '250px', padding: '12px',
                backgroundColor: '#000', color: '#fff', border: '1px solid #333',
                fontFamily: "'Fira Code', monospace", borderRadius: '4px', fontSize: '15px'
              }}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="マークダウン形式でコンテストのルールや説明を記述できます。"
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button variant="contained" color="success" startIcon={<SaveIcon />} onClick={handleSaveDescription} sx={{ fontWeight: 'bold' }}>
                Save Description
              </Button>
              <Button variant="outlined" onClick={() => { setIsEditingDesc(false); setEditDesc(contest.description); }}>
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Box className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
              {contest.description || "このコンテストに関する説明はありません。"}
            </ReactMarkdown>
          </Box>
        )}
      </Paper>

      {/* 問題一覧テーブル */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>Tasks</Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: 'background.paper', mb: 4 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#1e1e1e' }}>
            <TableRow>
              <TableCell align="center" width="10%">Label</TableCell>
              <TableCell width={user?.isAdmin ? '40%' : '50%'}>Task Name</TableCell>
              <TableCell align="center" width="20%">Time Limit</TableCell>
              <TableCell align="center" width="20%">Memory Limit</TableCell>
              {user?.isAdmin && <TableCell align="center" width="15%">Admin</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow><TableCell colSpan={user?.isAdmin ? 5 : 4} align="center" sx={{ py: 4 }}><Typography color="text.secondary">まだ問題が追加されていません。</Typography></TableCell></TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id} hover>
                  <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#90caf9' }}>{task.label}</TableCell>
                  <TableCell>
                    {isBeforeStart && !user?.isAdmin ? (
                      <Typography sx={{ fontSize: '1.1rem', color: 'text.secondary', fontWeight: 'bold' }}>{task.title} (未公開)</Typography>
                    ) : (
                      <Button component={RouterLink} to={`/contests/${contest_id}/tasks/${task.id}`} sx={{ textTransform: 'none', fontSize: '1.1rem', fontWeight: 'bold', color: '#e0e0e0', p: 0 }}>
                        {task.title}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell align="center">{task.time_limit} sec</TableCell>
                  <TableCell align="center">{task.memory_limit} MB</TableCell>
                  
                  {user?.isAdmin && (
                    <TableCell align="center">
                      <IconButton component={RouterLink} to={`/admin/contests/${contest_id}/tasks/${task.id}/testcases`} size="small" color="success" sx={{ mr: 1 }}><ScienceIcon fontSize="small" /></IconButton>
                      <IconButton component={RouterLink} to={`/admin/contests/${contest_id}/tasks/${task.id}/edit`} size="small" color="primary"><EditIcon fontSize="small" /></IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default ContestDetails;