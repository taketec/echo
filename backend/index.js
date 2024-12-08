import 'dotenv/config'
import mongoDBConnect from './mongodb/connection.js';
import express from 'express';
import userRoutes from './routes/user.js';
import bodyParser from 'body-parser';
import cors from 'cors';
import * as Server from 'socket.io';
import mongoose from "mongoose"
import { rateLimit } from 'express-rate-limit'
import { AuthSocket } from './middleware/auth.js';
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import { RedisStore } from 'rate-limit-redis'
import Message from './models/message.js'; 

const PORT = process.env.PORT || 8000


let REDIS_URL = process.env.REDIS_URL

console.log("This is the redis url -------------->>>>>> ",REDIS_URL)

//  if(process.env.PRODUCTION == "true"){
//    REDIS_URL = REDIS_URL+ "?family=0"
//  }


mongoose.set('strictQuery', false);
mongoDBConnect();

const allowed_origins =   [
  'http://localhost:3001',
  'http://localhost:3000',
  'http://localhost:3002',
  'http://192.168.1.4:3000',
  'https://stream-sync-app.onrender.com',
  'https://stream-sync-frontend-s3.s3-website.ap-south-1.amazonaws.com',
  'http://stream-sync-frontend-s3.s3-website.ap-south-1.amazonaws.com',
  'https://deploy.dd5lzrcymgwyt.amplifyapp.com'
]

const RateLimitclient = new Redis(REDIS_URL)

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit:100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	store: new RedisStore({
		// @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
		sendCommand: (...args) => RateLimitclient.call(...args),
	}),  
  statusCode:429,
  message:  (req, res) => {
		 return 'You can only make 100 requests every 15 min.'
	},
})



const app = express();
const corsConfig = {
  origin: allowed_origins,
  //origin: '*',
  credentials: true,
  methods:["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
};

const createLog = (req, res, next) => {
  res.on("finish", function() {
    console.log(req.method,req.body, decodeURI(req.url), res.statusCode, res.statusMessage);
  });
  next();
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(createLog)

if(process.env.PRODUCTION == "true"){
  app.use(limiter)
}


//app.use(limiter)
//xapp.options("*",cors(corsConfig))
app.use(cors(corsConfig));
app.use('/', userRoutes);

app.get('/', (req, res) => {
  res.json({ message: "hi humans" });
});

app.get('/x-forwarded-for', (request, response) => response.send(request.headers['x-forwarded-for']))

app.set('trust proxy', 1)
app.get('/ip', (request, response) => response.send(request.ip))

const server = app.listen(PORT, () => {
  console.log(`Server Listening at PORT - ${PORT}`);
});


const pubClient = new Redis(REDIS_URL);
const subClient = pubClient.duplicate();

pubClient.on("error", (err) => {
  console.log(err.message);
});

subClient.on("error", (err) => {
  console.log(err.message);
});

const io = new Server.Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: allowed_origins,
  },
  adapter: createAdapter(pubClient, subClient)
});

function get_time(){
	let d = new Date()
	let t = d.getTime()/1000
	// delta is the correction parameter
	return t
}
//simulate delay
// io.use((socket, next) => {
//   // Delay in milliseconds (adjust as needed)
//   const delay = 500; // 2 seconds delay
  
//   // Simulate delay before proceeding
//   setTimeout(() => {
//     next();
//   }, delay);
// });

const redisClient = new Redis(REDIS_URL);;

const ROOM_TTL = 86400

let TOTAL_USER_COUNT = 0
let DISCONNECTED_USER_COUNT = 0

app.get('/user-count', (request, response) => response.send({"USERS IN THE APP":TOTAL_USER_COUNT,"FAILED CONNECTIONS":DISCONNECTED_USER_COUNT}))


const transferMessages = async () => {
  try {
    const roomNames = await redisClient.keys('chatroom:*:messages');

    for (const roomName of roomNames) {
      const messages = await redisClient.lrange(roomName, 0, -1); 
      const parsedMessages = messages.map(msg => JSON.parse(msg)); 

      const messageDocs = parsedMessages.map(msg => ({
        room: msg.room,
        username: msg.username,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
      }));
      
      await Message.insertMany(messageDocs);

      await redisClient.del(roomName); 
    }

    

    console.log('Messages transferred to MongoDB and Redis cleared');

  //   for (const room of roomNames) {

  //     const mongoMessages = await Message.find({ room }).sort({ timestamp: 1 }); // Sort by timestamp ascending

  //     // Log the fetched MongoDB messages
  //     console.log('Messages fetched from MongoDB:');
  //     mongoMessages.forEach((message, index) => {
  //       console.log(`${index + 1}. ${message.username}: ${message.content} (${message.timestamp})`);
  //     });
  // } for debugging.
  } catch (error) {
    console.error('Error transferring messages:', error);
  }
};

setInterval(transferMessages, 60000);


io.use((socket, next) => AuthSocket(socket, next))
  .on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle joining a room
    socket.on('join_room', async ({ room, username }) => {
      socket.join(room);
      console.log(`${username} joined room: ${room}`);
      const redisMessages = await redisClient.lrange(`chatroom:${room}:messages`, 0, -1);
      const mongoMessages = await Message.find({ room }).sort({ timestamp: 1 }); // Sort by timestamp ascending

      const allMessages = [
        ...redisMessages.map(JSON.parse),  // parse Redis messages
        ...mongoMessages                  // directly use mongo messages 
      ];
  
      // sort messages by timestamp to get correct chronological order
      allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
      socket.emit('recent_messages', allMessages);

    });

    // Handle sending a message
    socket.on('message', async ({ room, username, content }) => {
      const timestamp = new Date().toISOString();
      const message = { room, username, content, timestamp };
      console.log("message recieved")
      // Store in Redis
      await redisClient.rpush(`chatroom:${room}:messages`, JSON.stringify(message));

      // Broadcast to other users in the room
      socket.to(room).emit('message', message);
    });
  });
/*
room_state schema
{room;//this will be a hashmap and the state will be basic json
      {
        users: [a,b,c,d], 
        state: {//state which is last updated
          media:"file",
          url:null,
          video_timestamp : 0.0,
          lastUpdated : 1234,
          playing:false,
          global_timestamp: 1234,
          client_uid: asdf//whoever updated it.
        } }}
or
      { 
        users: [a,b,c,d], 
        state: {
          media:"youtube",
          url:"https://www.youtube.com/watch?v=7XhhOVGF8sg&list=RD7XhhOVGF8sg&start_radio=1",
          video_timestamp : 0.0,
          lastUpdated : 5678,
          playing:false,
          global_timestamp: 5678,
          /client_uid: zxcvzxcv
              }
        }
}
*/