import { BrowserRouter, Routes, Route } from  'react-router';
import { Stack }  from '@mui/material';
import AppBar     from '@mui/material/AppBar';
import Toolbar    from '@mui/material/Toolbar';
import Button     from '@mui/material/Button';
import Home       from './routes/Home';
import RoomList   from './routes/RoomList';
import RoomMake   from './routes/RoomMake';
import './css/App.css'

function App() {
  const serverAddr = 'http://localhost:3000';

  return (
    <div>
      <BrowserRouter>

      <AppBar position='static' color='default'>
          <Toolbar>
              <Stack direction='row' spacing={2}>
                <Button variant="contained" href='/'         >Home     </Button>
                <Button variant="contained" href='/room/list'>Room List</Button>
                <Button variant="contained" href='/room/make'>Room Make</Button>
              </Stack>
          </Toolbar>
      </AppBar>

        <Routes>
          <Route path="/"          element={<Home     />} />
          <Route path="/room/list" element={<RoomList backendAddr={ serverAddr } />} />
          <Route path="/room/make" element={<RoomMake backendAddr={ serverAddr } />} />
        </Routes>
        
      </BrowserRouter>
    </div>
  )
}

export default App
