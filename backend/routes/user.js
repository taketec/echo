import {
    validUser,
    searchUsers,
    updateInfo,
    googleLogin,
    getUserById,
    refreshToken
  } from '../controllers/user.js';
  import express from 'express';

  import { Auth } from '../middleware/auth.js';

const router = express.Router();

//router.post('/auth/register', register);
//router.post('/auth/login', login);
router.post('/auth/google', googleLogin);
router.get('/auth/valid', Auth, validUser);
//router.get('/auth/logout', Auth, logout);
router.get('/api/user?', Auth, searchUsers);
router.get('/api/users/:id', Auth, getUserById);
router.post('/auth/refresh',refreshToken)
router.patch('/api/users/update/:id', Auth, updateInfo);
export default router;