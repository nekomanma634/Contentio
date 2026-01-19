import { BrowserRouter, Routes, Route, Link } from  'react-router';
import Home       from './routes/home'
import RoomList   from './routes/roomlist'
import AppBar     from '@mui/material/AppBar';
import Toolbar    from '@mui/material/Toolbar';
import Button     from '@mui/material/Button';
import './css/App.css'

function App() {
  return (
    <div>
      <BrowserRouter>

      <AppBar position='static'>
        <Toolbar>
            <Button variant="contained" href='/'         >Home     </Button>
            <Button variant="contained" href='/room/list'>Room List</Button>
        </Toolbar>
      </AppBar>

        <Routes>
          <Route path="/"          element={<Home     />} />
          <Route path="/room/list" element={<RoomList />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
