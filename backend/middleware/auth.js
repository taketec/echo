import jwt from 'jsonwebtoken';
import user from '../models/user.js';

export const Auth = async (req, res, next) => {
  try {
    
    let token = req.headers.authorization.split(' ')[0]; //when using browser this line
      const verifiedUser = jwt.verify(token, process.env.SECRET);
      console.log("verified user",verifiedUser)
      req.token = token;
      req.userId = verifiedUser.id

      // to get user data do this 
      // const rootUser = await user
      // .findOne({ _id: verifiedUser.id })
      // .select('-password');


    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ error: 'Invalid Token' });
  }
};

export const AuthSocket = async (socket, next) => {
  try {
    
     console.log(socket.handshake.auth.token)
    if (socket.handshake.auth.token){
      let x = jwt.verify(socket.handshake.auth.token, process.env.SECRET);
      if(x){next()}
    }
    else {
      console.log("error")
      next(new Error('Authentication error'));
    }    

  } catch (error) {
    console.log(error);
  }
};
