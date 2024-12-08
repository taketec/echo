// import argon2 from "argon2";
import user from '../models/user.js';
import axios from "axios"
import jwt from 'jsonwebtoken';
import { Redis } from "ioredis";
import crypto from "crypto"

let REDIS_URL = process.env.REDIS_URL

if(process.env.PRODUCTION == "true"){
  REDIS_URL = REDIS_URL+ "?family=0"
}

const RedisClient = new Redis(REDIS_URL)


export const register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await user.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: 'User already Exists' });
    const newuser = new user({ email, password,name: username });
    const token = await newuser.generateAuthToken();
    await newuser.save();
    res.json({ message: 'success', token: token });
  } catch (error) {
    console.log('Error in register ' + error);
    res.status(500).json({error:error});
  }
};
// export const login = async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const valid = await user.findOne({ email });
//     if (!valid) return res.status(404).json({ message: 'User does not exist' }); // Added return here

//     const validPassword = await argon2.verify(valid.password, password);
//     if (!validPassword) {
//       return res.status(401).json({ message: 'Invalid Credentials' }); // Added return here
//     }

//     const token = await valid.generateAuthToken();
//     await valid.save();
//     res.cookie('userToken', token, {
//       httpOnly: true,
//       maxAge: 24 * 60 * 60 * 1000,
//     });
//     return res.status(200).json({ token: token, status: 200 }); // Added return here
//   } catch (error) {
//     return res.status(500).json({ error: error.message }); // Send only error message
//   }
// };


  export const validUser = async (req, res) => {
    try {
      const validuser = await user
        .findOne({ _id: req.userId })
        .select('-password');
      if (!validuser) return res.status(401).json({ message: 'user is not valid' });
      return res.status(201).json({
        user: validuser,
        token: req.token,
      });
    } catch (error) {
      return res.status(401).json({ error: error });
      console.log(error);
    }
  };

  const generateRefreshToken = () => {
    return crypto.randomBytes(40).toString("hex"); // Generate a secure random string
  };

  const generateAccessToken = (clientData) => {
    const token = jwt.sign(JSON.parse(clientData), process.env.SECRET, { expiresIn: '15m' }); 
    return token
  };

  export const refreshToken = async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken ) return res.sendStatus(401);
      const clientData = await RedisClient.get(refreshToken);
      if (!clientData) return res.sendStatus(403); // Invalid or expired token


      const newAccessToken = generateAccessToken(clientData);

      const newRefreshToken = generateRefreshToken();

      await RedisClient.set(
        newRefreshToken,
        clientData,
        "EX",
        60 * 60 * 24 * 30 // 30 days expiry
      );
      // Set expiry of old refresh token to 5 seconds to handle multiple requests
      await RedisClient.set(refreshToken,clientData,"EX", 5);//to handle the edge case if a client fires 2 requests for a new token with the same RT at the same time
      //we dont delete the old token immediately, we keep it for some seconds.

      res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });

    } catch (error) {
      res.status(500).json({ error: error });
      console.log(error);
    }
  };


  export const googleLogin = async (req,res) => {
    try {

      let { token } = req.body
      console.log(token)

      // the request below basically gives you a object like this
      // {
      //   [0]   sub: '797750419735279',
      //   [0]   name: 'Shendra Pandit',
      //   [0]   given_name: 'Shandra',
      //   [0]   family_name: 'Pandit',
      //   [0]   picture: 'https://lh3.googleusercontent.com/a/ACg8ocKOya8vf1PaL34inwDaw1gYkoeHV8MbUTPxOvCEw4EnuC5L0m-o=s96-c',
      //   [0]   email: 'shailupan93@gmail.com',
      //   [0]   email_verified: true,
      //   [0]   locale: 'en'
      //   [0] }
      //and then we use it to either make a user or to login a existing one, idk if its safe enough or not.
      //i asked chatgpt if its safe and it said yes

      axios
      .get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
          "Authorization": `Bearer ${token}`
      }
    })
      .then(async response => {
        const username = response.data.name;
        const email = response.data.email;
        console.log(response.data)

        const existingUser = await user.findOne({ email });

        if (!existingUser) {
          console.log("user doesnt exist")
          const password = await jwt.sign(
            { username },
            process.env.SECRET,
            {
              expiresIn: '24h',
            }
          );
          console.log(password)
          const newuser = new user({ email, password,name: username });
          const token = await newuser.generateAuthToken();
          await newuser.save();

          const refreshToken = generateRefreshToken();

          await RedisClient.set(
            refreshToken,
            JSON.stringify({ id: newuser._id, email: newuser.email }),
            "EX",
            60 * 60 * 24 * 30 // 30 days expiry
          );

          return res.json({ message: 'success', token: token , refreshToken: refreshToken});
        }
        else{
          token = await existingUser.generateAuthToken()
          const refreshToken = generateRefreshToken();
          await RedisClient.set(
            refreshToken,
            JSON.stringify({ id: existingUser._id, email: existingUser.email }),
            "EX",
            60 * 60 * 24 * 30 // 30 days expiry
          );

          return res.json({ message: 'success', token: token , refreshToken: refreshToken});
        }
      })

    }
    catch(error){
      console.log(error)
    }
  }
  
  // export const logout = (req, res) => {
  //   req.rootUser.tokens = req.rootUser.tokens.filter((e) => e.token != req.token);
  // };

  export const searchUsers = async (req, res) => {
    // const { search } = req.query;
    const search = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: 'i' } },
            { email: { $regex: req.query.search, $options: 'i' } },
          ],
        }
      : {};
  
    const users = await user.find(search).find({ _id: { $ne: req.userId } });
    res.status(200).send(users);
  };

  export const getUserById = async (req, res) => {
    const { id } = req.params;
    try {
      const selectedUser = await user.findOne({ _id: id }).select('-password');
      res.status(200).json(selectedUser);
    } catch (error) {
      res.status(500).json({ error: error });
    }
  };
  
  export const updateInfo = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const updatedUser = await user.findByIdAndUpdate(id, { name });
    return updatedUser;
  };
  