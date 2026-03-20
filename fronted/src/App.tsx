import { BrowserRouter, Routes, Route }            from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import Layout           from './components/Layout';
import Home             from './routes/Home';
import Login            from './routes/Login';
import ProtectedRoute   from './components/ProtectedRoute';
import Register         from './routes/Register';
import Profile          from './routes/Profile';
import AdminRoute       from './components/AdminRoute';
import CreateTask       from './routes/CreateTask';
import ContestDetails   from './routes/ContestDetails';
import TaskDetail       from './routes/TaskDetail';
import CreateContest    from './routes/CreateContest';
import Submissions      from './routes/Submissions';
import ManageTestCases  from './routes/ManageTestCases';
import Ranking          from './routes/Ranking';
import Standings        from './routes/Standings';
import SystemLogs       from './routes/SystemLogs';

const ContestLayout = () => <div>Contest Specific Layout (ログイン済みのみ表示)</div>;

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    background: { default: '#22272e', paper: '#2d333b' },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>

              {/* 誰でもアクセス可能なルート */}
              <Route index                  element={<Home      />} />
              <Route path="login"           element={<Login     />} />
              <Route path="register"        element={<Register  />} />
              <Route path="ranking"         element={<Ranking   />} />
              <Route path="users/:username" element={<Profile   />} />
              
              {/* ログインが必要なルート*/}
              <Route element={<ProtectedRoute />}>
                <Route path="contests/:contest_id"                element={<ContestDetails  />} />
                <Route path="contests/:contest_id/*"              element={<ContestLayout   />} />
                <Route path="contests/:contest_id"                element={<ContestDetails  />} />
                <Route path="contests/:contest_id/submissions"    element={<Submissions     />} />
                <Route path="contests/:contest_id/standings"      element={<Standings       />} />
                <Route path="contests/:contest_id/tasks/:task_id" element={<TaskDetail      />} />
              </Route>

              {/* Admin権限が必要なルート*/}
              <Route element={<AdminRoute />}>
                  <Route path="admin/contests/create"                               element={<CreateContest   />} />
                  <Route path="admin/contests/:contest_id/tasks/create"             element={<CreateTask      />} />
                  <Route path="admin/contests/:contest_id/tasks/:task_id/edit"      element={<CreateTask      />} />
                  <Route path="admin/contests/:contest_id/tasks/:task_id/testcases" element={<ManageTestCases />} />
                  <Route path="admin/logs"                                          element={<SystemLogs      />} />
              </Route>

            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;