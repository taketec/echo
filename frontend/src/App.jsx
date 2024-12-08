import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.sass'
import {chats, messages} from "./dummydata"
import { Exception } from 'sass'


const TitleBar = ({toggleSidebar}) => {
  return (<div className="titleBar">
      <span>
        ezychat
      </span>

      <button onClick={toggleSidebar}>
        Settings
      </button>
  </div>)
}

const ChatList = ({chatlist, chatClickHandler}) => {
  if(!chatlist)
      return <div className='chatList'>No Chats</div>
  return (
    <div className = "chatList">
      {
        chatlist.map(
          c => 
            <div className='chatButton' key={c.id} onClick={() => chatClickHandler(c.id)}>
              <div className='chatName'>
                {c.name}
              </div>
              <div className='chatParticipants'>
                {c.participants.join(", ")}
              </div>
            </div>
          
        )
      }
    </div>
  )
}

const ChatBox = ({chat}) => {
  if (!chat)
      return <div className = "chatBox">Select a chat</div>
    
  return (
    <div className='chatBox'>
      {
        chat.map(
          (message, index) => <div className='message' key={message.time + index}>
              <img className='messageIcon' width={20} height={20} src={message.url} />
              <div className='messageAuthor' >{message.src}</div>
              <div className='messageContent'>{message.message}</div>
          </div>
        )
      }
    </div>
  )
}

async function getChats(){
  return chats;
}

async function getMessages(currentChat){
  return messages[currentChat];
}

function App(){
  const [currentChat, setCurrentChat] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [myChats, setMyChats] = useState(null)
  const [currentMessages, setCurrentMessages] = useState(null)

  const handleChatClick = (user) => {
    setCurrentChat(user)
    console.log("Current user changed to ", currentChat)
  };

  const toggleSettings = () => {
    setSidebarOpen(!sidebarOpen);
  }

  useEffect(() => {
    getChats()
    .then(
      c => {
        setMyChats(c)
        console.log("Loaded chats", c)
      }
    )
    .catch(e => console.error(e))
  }, [])

  useEffect(() => {
    getMessages(currentChat)
    .then(
      c => setCurrentMessages(c)
    )
  }, [currentChat])



  return (
  <>
    <div className="app">
      <TitleBar toggleSidebar={toggleSettings} />
      <div className="main-container">
        <ChatList chatlist = {myChats} chatClickHandler = {handleChatClick}/>
        <ChatBox chat = {currentMessages}>

        </ChatBox>
      </div>
    </div>
  </>
  )
}



// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

export default App;