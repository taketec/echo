import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import io from "socket.io-client"
import { useNavigate } from 'react-router-dom';
import { url, validUser } from '../apis/auth';

const ChatRoom = () => {

  const { roomId } = useParams();

  useEffect(() => {
    const socket_listen = async() => {
      socket = io(url, {auth: {
        token: localStorage.getItem('userToken')
      }})
      socket = io('http://localhost:8000')
      const response = await validUser();
      let username
      try{
      username = response.user.name;
      }
      catch{
        navigate('/login')
      }
      socket.emit('join_room', {room:roomId,username:username});
      
      socket.emit('message',{message})
      



      
      socket.on("message", (calculated_diff)=>{
         //add the message to the queue
       })
      
      return () => {
        socket.disconnect();
      };
    }
    socket_listen()},
   [])



    return (
x    );
  };
  
export default ChatRoom;
  