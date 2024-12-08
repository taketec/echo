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

const PORT = process.env.PORT || 8000


let REDIS_URL = process.env.REDIS_URL

if(process.env.PRODUCTION == "true"){
  REDIS_URL = REDIS_URL+ "?family=0"
}


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

const client = new Redis(REDIS_URL);;

const ROOM_TTL = 86400

let TOTAL_USER_COUNT = 0
let DISCONNECTED_USER_COUNT = 0

app.get('/user-count', (request, response) => response.send({"USERS IN THE APP":TOTAL_USER_COUNT,"FAILED CONNECTIONS":DISCONNECTED_USER_COUNT}))


io.use((socket,next)=>
AuthSocket(socket,next))  //authenticate socket connection with jwt.
.on('connection',(socket) => {

  socket.on('join_room', async ({ room, username }) => {
    const roomKey = `room:${room}`;
    const ROOM_TTL = 86400; // TTL (1 day in seconds)
    TOTAL_USER_COUNT = TOTAL_USER_COUNT+1
    // Check if the room exists, and initialize if it doesn’t
    const exists = await client.exists(roomKey);
    if (!exists) {
      console.log('New room created');
      const blankState = JSON.stringify({
        media: 'file',
        url: null,
        video_timestamp: 0.0,
        lastUpdated: get_time(),
        playing: false,
        global_timestamp: get_time(),
      });
  
      // Initialize the room with an empty user list and default state
      await client.hset(roomKey, 'users', JSON.stringify({}), 'state', blankState);
      await client.expire(roomKey, ROOM_TTL);
    }
  
    // Fetch and parse the current users object from Redis
    let users = JSON.parse(await client.hget(roomKey, 'users')) || {};
  
    // Initialize user’s connection array if it doesn’t exist, and add `socket.id`
    users[socket.id] = username;
    console.table(users)
    // Save updated users list back to Redis and set TTL
    await client.hset(roomKey, 'users', JSON.stringify(users));
    await client.expire(roomKey, ROOM_TTL); // Extend TTL whenever a user joins
  
    // Join the room and emit the updated user list
    socket.join(room);
    io.to(room).emit('userlist_update', Object.values(users)); // Emit unique usernames only
    console.log(`User ${username} (socket ${socket.id}) joined room ${room}`);
  });
  

  socket.on('explicit_state_request', async(room) => {
      const roomKey = `room:${room}`;
    
      // Fetch the room state from Redis
      let state = await client.hget(roomKey, 'state');
      if (state) {
        socket.emit('state_update_from_server', JSON.parse(state));
        await client.expire(roomKey, ROOM_TTL);
      } else {
        console.log(`Room ${room} not found`);
      }
    }
  )
  
  socket.on('time_sync_request_backward', () => {
    socket.emit('time_sync_response_backward',get_time())
  })

  socket.on('time_sync_request_forward', (time_at_client) => {
    socket.emit('time_sync_response_forward',get_time() - time_at_client)
  })

  socket.on('state_update_from_client',async (data) =>{
    console.log(data.state)

    const roomKey = `room:${data.room}`;

    let newState = {
      ...data.state,
      lastUpdated: get_time(),
      //client_uid: socket.id,
    };

    await client.hset(roomKey, 'state', JSON.stringify(newState));
    await client.expire(roomKey, ROOM_TTL);
    socket.to(data.room).emit('state_update_from_server', newState);
        
  }   )

  //have to use disconnecting here because once the socket is 'disconnected' its room data is lost
  socket.on('disconnecting', async () => {
    try {
      // Get the rooms the socket is connected to
      let rooms = Array.from(socket.rooms);
      console.log(socket.rooms)
      if (rooms.length > 1) {
        const room = rooms[1];
        const roomKey = `room:${room}`;
        console.log(rooms) //[ 'SN9W15L4Vk5AccWqAAAH', '12345' ]
        // Remove the user from the room’s user list in Redis
        let users = JSON.parse(await client.hget(roomKey, 'users'));
        delete users[rooms[0]];
        await client.hset(roomKey, 'users', JSON.stringify(users));

        console.log(Object.keys(users).length)
        
        if(Object.keys(users).length <= 0){
          await client.expire(roomKey, 60)
        }


        TOTAL_USER_COUNT = TOTAL_USER_COUNT - 1
        DISCONNECTED_USER_COUNT = DISCONNECTED_USER_COUNT + 1
        // Notify other users in the room
        io.to(room).emit('userlist_update', Object.values(users));
        console.log(`User ${socket.id} left room ${room}`);
      }
    } catch (error) {
      console.log('Error in disconnecting:', error);
    }
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