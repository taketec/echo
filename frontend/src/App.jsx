import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';

import Login from './pages/Login'; // Import your Login component
import JoinRoom from './pages/JoinRoom';
import ChatRoom from './pages/ChatRoom';

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Routes>
        <Route 
            path="/login" 
            element={<Login />} />
        <Route 
            path="/join-room" 
            element={<JoinRoom />} />
        <Route 
            path="/room/:roomId" 
            element={<ChatRoom />}
        />  

        <Route
            exact
            path="/"
            element={<Navigate to="/login" />}
        />
      </Routes>
    </Router>

  )
}

export default App
