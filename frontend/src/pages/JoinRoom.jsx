import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { url, validUser } from '../apis/auth';

const JoinRoom = () => {
  const navigate = useNavigate();
  const [room, setRoom] = useState('');
  const [recentRooms, setRecentRooms] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const check_auth = async () => {
      try {
        const token = localStorage.getItem('userToken');
        if (token) {
          const response = await validUser();
          if (!response.token) {
            navigate('/login'); // Replace with your dashboard route
            
            localStorage.removeItem('userToken'); // Clear invalid token

          }
          } 
        else {
          navigate('/login'); // Replace with your dashboard route
        }
        }
     catch (error) {
        console.error('Error checking authentication:', error);
      }
    };
    check_auth();}, 
  []); 


  // Load recent rooms from localStorage on component mount
  useEffect(() => {
    const storedRooms = JSON.parse(localStorage.getItem('recentRooms')) || [];
    setRecentRooms(storedRooms);
  }, []);

  const handleJoinRoom = () => {
    if (room) {
      // Store the current room in recent rooms in local storage
      const updatedRooms = [room, ...recentRooms].slice(0, 5); // Limit to last 5 rooms
      localStorage.setItem('recentRooms', JSON.stringify(updatedRooms));

      // Navigate to the room (or replace with your actual logic for joining the room)
      navigate(`/room/${room}`);
    } else {
      setErrorMessage('Please enter a room name');
    }
  };

  const handleRecentRoomClick = (roomName) => {
    // Navigate directly to the clicked recent room
    navigate(`/room/${roomName}`);
  };


  return (
    <div className="flex min-h-screen items-center justify-center ">
      <div className="w-full max-w-md p-8 space-y-3 rounded-lg bg-black/64 rounded-lg shadow-lg backdrop-blur-sm border border-gray-800">
        <h1 className="text-2xl font-bold text-center text-gray-100">Join a Room</h1>
        {errorMessage && <div className="text-red-500 dark:text-red-400 text-center">{errorMessage}</div>}
        
        {/* Room Name Input */}
        <div>
          <label htmlFor="room" className="text-gray-100">Enter Room Name</label>
          <input
            type="text"
            id="room"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="block w-full px-4 py-2 mt-2 text-sm font-medium text-gray-900 bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Room name"
          />
        </div>

        {/* Join Room Button */}
        <button
          onClick={handleJoinRoom}
          className="block w-full px-4 py-2 mt-4 text-sm font-medium text-center text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          Join Room 🚀
        </button>

        {/* Recent Rooms Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-100">Recent Rooms</h2>
          {recentRooms.length > 0 ? (
            <div className="mt-2 space-y-2">
              {recentRooms.map((room, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentRoomClick(room)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-400 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none"
                >
                  {room}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No recent rooms</p>
          )}
        </div>
        
        <div className="flex justify-center mt-8">
          <h1 className="text-xs text-center text-gray-600 text-gray-400">Welcome back to ECHO 🌀🌀🌀</h1>
        </div>
      </div>
    </div>  );
};
export default JoinRoom;
