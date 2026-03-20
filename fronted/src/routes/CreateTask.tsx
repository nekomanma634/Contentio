import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, TextField, Button, Typography, Paper, Box, ToggleButton, ToggleButtonGroup, Alert } from '@mui/material';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CreateTask = () => {
  // URLから task_id も取得（無い場合は undefined になり「新規作成モード」になる）
  const { contest_id, task_id } = useParams<{ contest_id: string; task_id?: string }>();
  const isEditMode = !!task_id; // task_id があれば true

  const [taskLabel, setTaskLabel] = useState('A');
  const [title, setTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState('2.0');
  const [memoryLimit, setMemoryLimit] = useState('1024');
  const [markdown, setMarkdown] = useState('## 問題文\n\nここに問題の記述を書きます。');
  
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  // 編集モードの場合、初期表示時に既存のデータを取得してフォームにセットする
  useEffect(() => {
    if (isEditMode && task_id) {
      const fetchExistingTask = async () => {
        try {
          const response = await fetch(`http://localhost:3000/api/tasks/${task_id}`);
          if (!response.ok) throw new Error('問題データの取得に失敗しました');
          
          const data = await response.json();
          setTitle(data.title);
          setTimeLimit(data.time_limit.toString());
          setMemoryLimit(data.memory_limit.toString());
          setMarkdown(data.markdown_content);
        } catch (err: any) {
          setErrorMsg(err.message);
        }
      };
      fetchExistingTask();
    }
  }, [isEditMode, task_id]);

  const handleViewChange = (_event: React.MouseEvent<HTMLElement>, newMode: 'split' | 'editor' | 'preview' | null) => {
    if (newMode !== null) setViewMode(newMode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      const newMarkdown = markdown.substring(0, start) + '  ' + markdown.substring(end);
      setMarkdown(newMarkdown);
      setTimeout(() => { target.selectionStart = target.selectionEnd = start + 2; }, 0);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!title.trim() || !markdown.trim()) {
      setErrorMsg('問題のタイトルと問題文は必須です。');
      return;
    }

    try {
      // モードによって送信先APIとHTTPメソッド（POST or PUT）を切り替える
      const apiUrl = isEditMode 
        ? `http://localhost:3000/api/admin/tasks/${task_id}` 
        : 'http://localhost:3000/api/admin/tasks';
        
      const apiMethod = isEditMode ? 'PUT' : 'POST';

      // 編集時は contest_id と task_label は送らない（既存のものを保持するため）
      const requestBody = isEditMode 
        ? { title, time_limit: timeLimit, memory_limit: memoryLimit, markdown }
        : { contest_id, task_label: taskLabel, title, time_limit: timeLimit, memory_limit: memoryLimit, markdown };

      const response = await fetch(apiUrl, {
        method: apiMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error('保存に失敗しました。サーバーの状態を確認してください。');

      setSuccessMsg(isEditMode ? '問題を更新しました！ 戻ります...' : '問題を正常に作成しました！ 次の問題のためにリセットします...');
      
      setTimeout(() => {
        if (isEditMode) {
          // 編集モードなら、コンテスト詳細ページへ戻る
          navigate(`/contests/${contest_id}`);
        } else {
          // 新規作成モードなら、次の問題（A -> B）を書けるようにクリアする
          setTaskLabel(String.fromCharCode(taskLabel.charCodeAt(0) + 1));
          setTitle('');
          setMarkdown('## 問題文\n\n');
          setSuccessMsg('');
        }
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const editorHeight = 'calc(100vh - 220px)'; 

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* タイトルもモードに合わせて変更 */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        ⚙️ {isEditMode ? 'Edit Task (Admin)' : 'Create New Task (Admin)'}
      </Typography>

      {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
      {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flexGrow: 1, alignItems: 'center' }}>
          
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#90caf9', mr: 2 }}>
            {contest_id?.toUpperCase()}
          </Typography>

          {/* 新規作成の時だけ Label 入力を表示する */}
          {!isEditMode && (
            <TextField label="Label" size="small" value={taskLabel} onChange={(e) => setTaskLabel(e.target.value.toUpperCase())} sx={{ width: 80 }} />
          )}
          
          <TextField label="Problem Title" size="small" value={title} onChange={(e) => setTitle(e.target.value)} sx={{ flexGrow: 1, minWidth: '250px' }} />
          <TextField label="Time Limit (sec)" size="small" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} sx={{ width: 130 }} />
          <TextField label="Memory Limit (MB)" size="small" value={memoryLimit} onChange={(e) => setMemoryLimit(e.target.value)} sx={{ width: 130 }} />
          <Button variant="contained" color="success" onClick={handleSubmit} sx={{ fontWeight: 'bold', px: 4 }}>
            {isEditMode ? 'Update Task' : 'Save Task'}
          </Button>
        </Box>

        <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewChange} size="small" sx={{ bgcolor: 'background.paper' }}>
          <ToggleButton value="editor" aria-label="editor only"><EditIcon sx={{ mr: 1, fontSize: 20 }} /> Editor</ToggleButton>
          <ToggleButton value="split" aria-label="split view"><ViewColumnIcon sx={{ mr: 1, fontSize: 20 }} /> Split</ToggleButton>
          <ToggleButton value="preview" aria-label="preview only"><VisibilityIcon sx={{ mr: 1, fontSize: 20 }} /> Preview</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* エディタ ＆ プレビュー領域 */}
      <Box sx={{ display: 'flex', gap: 2, width: '100%', height: editorHeight }}>
        
        {viewMode !== 'preview' && (
          <Box sx={{ flex: viewMode === 'editor' ? '1 1 100%' : '1 1 50%', minWidth: 0, height: '100%' }}>
            <Box component="textarea" value={markdown} onChange={(e) => setMarkdown(e.target.value)} onKeyDown={handleKeyDown} placeholder="Markdownを入力..."
              sx={{ width: '100%', height: '100%', padding: '16px', fontFamily: "'Fira Code', 'Consolas', monospace", fontSize: '15px', lineHeight: 1.6, backgroundColor: '#1e1e1e', color: '#d4d4d4', border: '1px solid #333', borderRadius: '4px', outline: 'none', resize: 'none', whiteSpace: 'pre', overflow: 'auto', boxSizing: 'border-box', '&:focus': { borderColor: '#90caf9' } }}
            />
          </Box>
        )}

        {viewMode !== 'editor' && (
          <Box sx={{ flex: viewMode === 'preview' ? '1 1 100%' : '1 1 50%', minWidth: 0, height: '100%' }}>
            <Paper variant="outlined" sx={{ p: 4, height: '100%', overflowY: 'auto', overflowX: 'auto', bgcolor: '#1e1e1e', borderRadius: '4px', overflowWrap: 'anywhere' }}>
              <Typography variant="overline" color="text.secondary" sx={{ mb: 2, display: 'block' }}>Preview</Typography>
              <Box className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={{ code({ node, inline, className, children, ...props }: any) { const match = /language-(\w+)/.exec(className || ''); return !inline && match ? ( <SyntaxHighlighter style={vscDarkPlus as any} language={match[1]} PreTag="div" {...props}>{String(children).replace(/\n$/, '')}</SyntaxHighlighter> ) : ( <code className={className} {...props} style={{ backgroundColor: '#333', padding: '2px 4px', borderRadius: '4px', fontFamily: "'Fira Code', monospace" }}>{children}</code> ); } }}>
                  {markdown}
                </ReactMarkdown>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default CreateTask;