import { Router } from 'express';
import { createScore, getLeaderboard, getUserScores } from '../controllers/score.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createScoreValidation, leaderboardValidation, paginationValidation } from '../utils/validator.util';

const router = Router();

// POST /api/scores - Save score (protected)
router.post(
  '/',
  authenticate,
  validate(createScoreValidation),
  createScore
);

// GET /api/scores/leaderboard/:songId - Get leaderboard
router.get(
  '/leaderboard/:songId',
  validate(leaderboardValidation),
  getLeaderboard
);

// GET /api/scores/user/:userId - Get user scores (protected)
router.get(
  '/user/:userId',
  authenticate,
  validate(paginationValidation),
  getUserScores
);

export default router;
