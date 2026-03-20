import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Container, Typography, Paper, Box, CircularProgress, Alert, Button, MenuItem, Select, FormControl, InputLabel, ToggleButton, ToggleButtonGroup, Chip } from '@mui/material';

import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import DescriptionIcon from '@mui/icons-material/Description';
import CodeIcon from '@mui/icons-material/Code';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAuth } from '../contexts/AuthContext';
import Editor from '@monaco-editor/react';

interface TaskData {
  id: number;
  title: string;
  time_limit: number;
  memory_limit: number;
  markdown_content: string;
}

// 👇 コンテスト情報を取得するための型を追加
interface ContestInfo {
  id: string;
  title: string;
  start_time: string;
  duration_minutes: number;
  is_rated: boolean;
}

const TaskDetail = () => {
  const { contest_id, task_id } = useParams<{ contest_id: string; task_id: string }>();
  const [task, setTask] = useState<TaskData | null>(null);
  const [contest, setContest] = useState<ContestInfo | null>(null); // 追加
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // 👇 タイマー用のステートを追加
  const [now, setNow] = useState(new Date());

  const { user } = useAuth();
  const [judgeResult, setJudgeResult] = useState<{status: string, message: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [language, setLanguage] = useState('cpp');
  const [sourceCode, setSourceCode] = useState('');

  const [viewMode, setViewMode] = useState<'split' | 'task' | 'editor'>('split');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 👇 問題データとコンテストデータを同時に取得する
        const [taskRes, contestRes] = await Promise.all([
          fetch(`http://localhost:3000/api/tasks/${task_id}`),
          fetch(`http://localhost:3000/api/contests/${contest_id}`)
        ]);

        if (!taskRes.ok || !contestRes.ok) {
          throw new Error('データの取得に失敗しました');
        }

        const taskData = await taskRes.json();
        const contestData = await contestRes.json();

        // 時間のズレを防ぐための処理
        contestData.start_time = new Date(contestData.start_time.replace(' ', 'T'));

        setTask(taskData);
        setContest(contestData);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (task_id && contest_id) fetchData();

    // 1秒ごとに時間を更新するタイマー
    const timerId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timerId);
  }, [task_id, contest_id]);

  const handleSubmitCode = async () => {
    if (!user) {
      alert("ログインが必要です");
      return;
    }
    setIsSubmitting(true);
    setJudgeResult({ status: 'WJ', message: 'ジャッジ中 (Waiting for Judge)...' });

    const payload = {
      username: user.username || (user as any).name || 'unknown_user',
      task_id: parseInt(task_id || '0', 10),
      language: language,
      code: sourceCode,
    };

    try {
      const response = await fetch('http://localhost:3000/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`提出失敗 (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      setJudgeResult(data);
    } catch (err: any) {
      setJudgeResult({ status: 'Error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newMode: 'split' | 'task' | 'editor' | null) => {
    if (newMode !== null) setViewMode(newMode);
  };

  const handleEditorWillMount = (monaco: any) => {
    monaco.editor.defineTheme('vsc-dark-plus', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '569CD6' },
        { token: 'keyword.control', foreground: 'C586C0' },
        { token: 'keyword.directive', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'comment', foreground: '6A9955' },
        { token: 'type.identifier', foreground: '4EC9B0' },
        { token: 'identifier', foreground: '9CDCFE' },
        { token: 'operator', foreground: 'D4D4D4' },
        { token: 'delimiter', foreground: 'D4D4D4' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2a2d2e',
        'editor.selectionBackground': '#264f78',
      }
    });

    monaco.languages.registerCompletionItemProvider('cpp', {
      provideCompletionItems: (model: any, position: any) => {
        const suggestions = [
          {
            label: 'template',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: [
              '#include <iostream>',
              '#include <vector>',
              '#include <string>',
              '#include <algorithm>',
              '',
              'using namespace std;',
              '',
              'int main() {',
              '\tios_base::sync_with_stdio(false);',
              '\tcin.tie(NULL);',
              '',
              '\t$0',
              '',
              '\treturn 0;',
              '}'
            ].join('\n'),
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '競技プログラミング用 C++ テンプレート',
          },
          {
            label: 'cout',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'cout << ${1:ans} << endl;',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: '標準出力',
          },
          {
            label: 'rep',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: [
              'for (int ${1:i} = 0; ${1:i} < ${2:n}; ++${1:i}) {',
              '\t$0',
              '}'
            ].join('\n'),
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'forループ',
          }
        ];
        return { suggestions: suggestions };
      }
    });
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (errorMsg || !task || !contest) return <Container maxWidth="lg" sx={{ mt: 4 }}><Alert severity="error">{errorMsg}</Alert></Container>;

  // 👇 時間の計算ロジック
  const startTime = contest.start_time as unknown as Date;
  const endTime = new Date(startTime.getTime() + contest.duration_minutes * 60000);
  
  const isBeforeStart = now < startTime;
  const isEnded = now > endTime;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          <Button component={RouterLink} to={`/contests/${contest_id}`} sx={{ fontSize: '1.5rem', fontWeight: 'bold', minWidth: 0, p: 0, mr: 1, color: '#90caf9' }}>
            {contest_id?.toUpperCase()}
          </Button>
          / {task.title}
        </Typography>

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 3, color: 'text.secondary' }}>
          {/* 👇 終了している場合は目立つようにバッジを表示 */}
          {isEnded && <Chip label="Contest Ended" color="default" sx={{ fontWeight: 'bold' }} />}
          {isBeforeStart && <Chip label="Not Started" color="primary" sx={{ fontWeight: 'bold' }} />}
          
          <Typography>Time Limit: <b>{task.time_limit} sec</b></Typography>
          <Typography>Memory Limit: <b>{task.memory_limit} MB</b></Typography>
          
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
            sx={{ bgcolor: 'background.paper', ml: 2 }}
          >
            <ToggleButton value="task" title="問題文を全画面表示"><DescriptionIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="split" title="左右分割表示"><ViewColumnIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="editor" title="エディタを全画面表示"><CodeIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 180px)' }}>
        
        <Box sx={{ 
          display: viewMode === 'editor' ? 'none' : 'block',
          flex: viewMode === 'task' ? '1 1 100%' : '1 1 50%', 
          minWidth: 0, height: '100%', transition: 'flex 0.3s ease' 
        }}>
          <Paper variant="outlined" sx={{ p: 4, height: '100%', overflowY: 'auto', bgcolor: '#1e1e1e', borderRadius: '8px', overflowWrap: 'anywhere' }}>
            <Box className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter style={vscDarkPlus as any} language={match[1]} PreTag="div" {...props}>
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props} style={{ backgroundColor: '#333', padding: '2px 4px', borderRadius: '4px' }}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {task.markdown_content}
              </ReactMarkdown>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ 
          display: viewMode === 'task' ? 'none' : 'flex',
          flex: viewMode === 'editor' ? '1 1 100%' : '1 1 50%', 
          minWidth: 0, height: '100%', flexDirection: 'column', gap: 2, transition: 'flex 0.3s ease'
        }}>
          
          <FormControl fullWidth size="small" variant="outlined" sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
            <InputLabel>Language</InputLabel>
            <Select value={language} label="Language" onChange={(e) => setLanguage(e.target.value)}>
              <MenuItem value="cpp">C++ (GCC 12)</MenuItem>
              <MenuItem value="rust">Rust (1.70)</MenuItem>
              <MenuItem value="python">Python (3.11)</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ flexGrow: 1, width: '100%', borderRadius: '4px', overflow: 'hidden', bgcolor: '#1e1e1e' }}>
            <Editor
              height="100%"
              theme="vsc-dark-plus"
              beforeMount={handleEditorWillMount}
              language={language}
              value={sourceCode}
              onChange={(value) => setSourceCode(value || '')}
              options={{
                fontSize: 15,
                fontFamily: "'Consolas', 'Fira Code', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16 },
                renderLineHighlight: 'all',
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                readOnly: isEnded || isBeforeStart, // 終了時・開始前はエディタ自体も編集不可にする
              }}
            />
          </Box>

          {/* ボタンの disabled 条件に isEnded と isBeforeStart を追加し、表示テキストも切り替える */}
          <Button 
            variant="contained" 
            color={isEnded || isBeforeStart ? 'inherit' : 'primary'} 
            size="large" 
            onClick={handleSubmitCode} 
            disabled={isSubmitting || !sourceCode.trim() || isEnded || isBeforeStart} 
            sx={{ fontWeight: 'bold', py: 1.5 }}
          >
            {isBeforeStart ? 'Contest Not Started' : 
             isEnded ? 'Contest Ended (Submissions Closed)' : 
             isSubmitting ? 'Judging...' : 'Submit Code'}
          </Button>

          {judgeResult && (
            <Paper sx={{ 
              p: 2, textAlign: 'center', fontWeight: 'bold', fontSize: '1.5rem',
              bgcolor: judgeResult.status === 'AC' ? '#1b5e20' : 
                       judgeResult.status === 'WJ' ? '#f57c00' : '#b71c1c',
              color: 'white'
            }}>
              {judgeResult.status}: {judgeResult.message}
            </Paper>
          )}

        </Box>
      </Box>
    </Container>
  );
};

export default TaskDetail;