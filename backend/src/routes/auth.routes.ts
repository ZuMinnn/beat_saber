import { Router } from 'express';
import { register, login, verifyToken } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';
import { registerValidation, loginValidation } from '../utils/validator.util';

const router = Router();

// POST /api/auth/register - Register new user
router.post(
  '/register',
  authLimiter,
  validate(registerValidation),
  register
);

// POST /api/auth/login - Login with email/password
router.post(
  '/login',
  authLimiter,
  validate(loginValidation),
  login
);

// GET /api/auth/me - Verify token and get user data
router.get(
  '/me',
  authenticate,
  verifyToken
);

export default router;
