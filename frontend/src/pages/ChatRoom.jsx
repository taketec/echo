import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { url, validUser } from '../apis/auth';

let socket;

const ChatRoom = () => {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]); // Stores chat messages
  const [newMessage, setNewMessage] = useState(''); // Stores user input for sending a message
  const messagesEndRef = useRef(null); // For auto-scrolling to the latest message
  const navigate = useNavigate();
  const username = useRef('')
  useEffect(() => {

    const socket_listen = async () => {
      try {
        const response = await validUser();
        username.current = response?.user?.name;
        if (!username.current) {
          navigate('/login');
          return;
        }

        // Connect to the server
        socket = io(url, {
          auth: {
            token: localStorage.getItem('userToken'),
          },
        });

        // Join the room
        socket.emit('join_room', { room: roomId, username });

        // Listen for messages
        socket.on('message', (newMessage) => {
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        });
      } catch (error) {
        console.error('Error connecting to chat room:', error);
        navigate('/login');
      }

      // Cleanup on component unmount
      return () => {
        if (socket) socket.disconnect();
      };
    };

    socket_listen();
  }, [roomId, navigate]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const messageObj = {
        room: roomId,
        username: username.current, // Assuming current user's messages should be marked as "You"
        content: newMessage,
        timestamp: new Date().toISOString(),
      };
      setMessages((prevMessages) => [...prevMessages, messageObj]); // Optimistic update
      socket.emit('message', messageObj); // Send the message to the server
      setNewMessage(''); // Clear the input field
    }
  };

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
<div className="flex flex-col h-screen bg-gray-900">
  {/* Chat Header */}
  <div className="bg-gray-800 text-gray-100 py-3 px-5 text-lg font-semibold shadow-md">
    Chat Room: {roomId}
  </div>

  {/* Messages Container */}
  <div className="flex-1 overflow-y-auto bg-gray-800 p-5">
    {messages.map((msg, index) => (
      <div
        key={index}
        className={`flex mb-3 ${msg.username === 'You' ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`rounded-lg p-3 max-w-xs shadow-md ${
            msg.username === 'You' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
          }`}
        >
          <p className="font-bold">{msg.username}</p>
          <p>{msg.content}</p>
          <span className="text-sm text-gray-400">
            {new Date(msg.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
    ))}
    <div ref={messagesEndRef} /> {/* Auto-scroll target */}
  </div>

  {/* Input Section */}
  <div className="bg-gray-800 flex items-center px-4 py-3 shadow-md">
    <input
      type="text"
      value={newMessage}
      onChange={(e) => setNewMessage(e.target.value)}
      placeholder="Type a message..."
      className="flex-1 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <button
      onClick={sendMessage}
      className="ml-3 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      Send
    </button>
  </div>
</div>
  );
};

export default ChatRoom;
